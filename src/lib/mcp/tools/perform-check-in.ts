import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "perform_check_in",
  title: "Check in (reset the switch)",
  description:
    "Record a check-in for the signed-in user. This resets the dead man's switch countdown, cancels any active grace period, and logs the check-in in history. Use when the user tells their assistant they are still alive/well and want to postpone the switch.",
  inputSchema: {},
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId()!;
    const now = new Date();

    const { data: settings, error: readErr } = await supabase
      .from("user_settings")
      .select("check_in_frequency, deadline_mode, grace_period_hours")
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr) return { content: [{ type: "text", text: readErr.message }], isError: true };
    if (!settings) {
      return { content: [{ type: "text", text: "Switch not configured. Set it up in the app first." }], isError: true };
    }

    // Compute next deadline from frequency string like "7d", "14d", "1m".
    const freq = settings.check_in_frequency || "30d";
    const match = /^(\d+)([dwm])$/.exec(freq);
    const next = new Date(now);
    if (match) {
      const n = parseInt(match[1], 10);
      const unit = match[2];
      if (unit === "d") next.setDate(next.getDate() + n);
      else if (unit === "w") next.setDate(next.getDate() + n * 7);
      else if (unit === "m") next.setMonth(next.getMonth() + n);
    } else {
      next.setDate(next.getDate() + 30);
    }

    const { error: updErr } = await supabase
      .from("user_settings")
      .update({
        last_check_in: now.toISOString(),
        next_check_in_due: next.toISOString(),
        grace_period_active: false,
        grace_period_end: null,
        switch_triggered: false,
        switch_triggered_at: null,
      })
      .eq("user_id", userId);
    if (updErr) return { content: [{ type: "text", text: updErr.message }], isError: true };

    await supabase.from("check_in_history").insert({
      user_id: userId,
      checked_in_at: now.toISOString(),
      deadline_at: next.toISOString(),
      deadline_mode: settings.deadline_mode ?? null,
      grace_period_hours: settings.grace_period_hours ?? null,
      method: "mcp",
    });

    return {
      content: [
        {
          type: "text",
          text: `Checked in. Next check-in due ${next.toISOString()}.`,
        },
      ],
      structuredContent: { checked_in_at: now.toISOString(), next_check_in_due: next.toISOString() },
    };
  },
});
