import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getSwitchStatus from "./tools/get-switch-status";
import performCheckIn from "./tools/perform-check-in";
import getPlan from "./tools/get-plan";
import listContacts from "./tools/list-contacts";
import getCheckInHistory from "./tools/get-check-in-history";

// The OAuth issuer MUST be the direct Supabase host, built from the project ref
// so the runtime issuer matches what the discovery document publishes.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "legacyvault-mcp",
  title: "LegacyVault",
  version: "0.1.0",
  instructions:
    "Tools for LegacyVault — a zero-knowledge encrypted dead man's switch. Use `perform_check_in` when the user says they are still alive/well or wants to reset the switch. Use `get_switch_status` to see when the next check-in is due. Encrypted fields (names, phone numbers, notes) are never returned; only metadata.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getSwitchStatus, performCheckIn, getPlan, listContacts, getCheckInHistory],
});
