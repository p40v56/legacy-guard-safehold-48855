import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_URL = Deno.env.get("APP_BASE_URL");
const ALLOWED_ORIGINS = [
  "https://id-preview--6cf11843-b093-41a4-b4d5-f63b642b4451.lovable.app",
  "https://6cf11843-b093-41a4-b4d5-f63b642b4451.lovableproject.com",
  "https://legacy-guard-safehold-48855.lovable.app",
  "http://localhost:5173",
  "http://localhost:3000",
  ...(APP_URL ? [APP_URL] : []),
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const body = await req.json().catch(() => ({} as any));

    // Check if this is an automated call from cron (service role key in Authorization)
    const isAutomated = body.automated === true && authHeader === `Bearer ${serviceRoleKey}`;
    let userId: string;
    let userEmail: string | undefined;

    if (isAutomated && body.userId) {
      userId = body.userId;
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data } = await adminClient.auth.admin.getUserById(userId);
      userEmail = data?.user?.email || undefined;
    } else {
      // Verify the caller's JWT
      const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await callerClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Require password re-verification
      const password = body.password;
      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Password required to delete account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const verifyClient = createClient(supabaseUrl, anonKey);
      const { error: signInError } = await verifyClient.auth.signInWithPassword({
        email: user.email!,
        password,
      });
      if (signInError) {
        return new Response(
          JSON.stringify({ error: 'Incorrect password. Account deletion cancelled.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = user.id;
      userEmail = user.email;
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete all user data from all tables (ordered by FK dependencies)
    const tables = [
      'portal_access_attempts',
      'contact_shares',
      'contact_access_tokens',
      'sent_notifications',
      'security_questions',
      'activation_rules',
      'notification_settings',
      'check_in_tokens',
      'check_in_history',
      'user_settings',
      'contact_type_permissions',
      'accounts',
      'legacy_documents',
      'financial_assets',
      'contacts',
      'user_roles',
      'profiles',
    ];

    for (const table of tables) {
      await adminClient.from(table).delete().eq('user_id', userId);
    }

    // Delete user files from storage
    try {
      const { data: files } = await adminClient.storage
        .from('documents')
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${userId}/${f.name}`);
        await adminClient.storage.from('documents').remove(filePaths);
      }

      // Also check for flat-stored files
      const { data: rootFiles } = await adminClient.storage
        .from('documents')
        .list('', { search: userId });
    } catch (storageErr) {
      console.error('Storage cleanup error (non-fatal):', storageErr);
    }

    // Delete the auth user
    const userEmail = user.email;
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;

    // Send deletion confirmation email (non-blocking)
    if (userEmail) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
          body: JSON.stringify({
            notificationType: 'account_deleted',
            recipientEmail: userEmail,
            deletedBy: 'self',
          }),
        });
      } catch { /* non-blocking */ }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});