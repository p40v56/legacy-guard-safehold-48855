// Shared CORS helpers for all edge functions.
// Extend ALLOWED_ORIGINS via APP_BASE_URL env var.

const APP_URL = Deno.env.get("APP_BASE_URL");

export const ALLOWED_ORIGINS = [
  "https://id-preview--6cf11843-b093-41a4-b4d5-f63b642b4451.lovable.app",
  "https://6cf11843-b093-41a4-b4d5-f63b642b4451.lovableproject.com",
  "https://legacy-guard-safehold-48855.lovable.app",
  "http://localhost:5173",
  "http://localhost:3000",
  ...(APP_URL ? [APP_URL] : []),
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-internal-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

/** Constant-time string comparison for secrets, tokens, hashes. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** SHA-256 → base64. */
export async function sha256Base64(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Minimal HTML escaping for email/HTML string interpolation. */
export function escapeHtml(input: unknown): string {
  if (input == null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Return `raw` iff it is a well-formed http(s) URL. Otherwise returns "".
 * Blocks javascript:, data:, vbscript:, and other injection vectors in href attributes.
 * Set `originAllowlisted` to true to additionally require the URL start with an ALLOWED_ORIGINS entry.
 */
export function safeExternalUrl(raw: unknown, originAllowlisted = false): string {
  if (typeof raw !== "string" || !raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (originAllowlisted && !ALLOWED_ORIGINS.some((o) => raw.startsWith(o))) return "";
    return raw;
  } catch {
    return "";
  }
}

