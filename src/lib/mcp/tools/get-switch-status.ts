import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_switch_status",
  title: "Get dead man's switch status",
  description:
    "Return the signed-in user's dead man's switch status: whether it is active, when the next check-in is due, last check-in time, grace period state, and whether the switch has been triggered.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("user_settings")
      .select(
        "is_active, deadline_mode, check_in_frequency, last_check_in, next_check_in_due, grace_period_active, grace_period_end, grace_period_hours, switch_triggered, switch_triggered_at, custom_deadline",
      )
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return {
        content: [{ type: "text", text: "No switch configured yet." }],
        structuredContent: { configured: false },
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { configured: true, status: data },
    };
  },
});
