# Security & Correctness Remediation Plan

Scope: every item in the audit (C1–C6, H1–H5, M1–M6, Q1–Q6). Ordered so each step leaves the app in a working state. Every share-model change (C2, C6, H3) will invalidate existing portal links — owners will have to regenerate; that is unavoidable for true zero-knowledge.

---

## Phase 1 — SQL hardening (single migration)

Closes C1, H1, M2. Pure SQL, no code changes.

1. Redefine `admin_update_profile`, `admin_list_profiles`, `admin_get_stats` with an explicit `has_role(auth.uid(),'admin')` guard that raises `42501` when false. Keep the jsonb-key whitelist in `admin_update_profile`.
2. `REVOKE EXECUTE ON FUNCTION public.admin_* FROM PUBLIC, anon;` then `GRANT EXECUTE ... TO authenticated;`.
3. Drop the `USING (true) WITH CHECK (true)` policies on `check_in_tokens` and `check_in_history`. Replace with owner-scoped `SELECT`/`INSERT` where the app actually needs client access; otherwise leave the tables locked (service role bypasses RLS).
4. Audit every existing `SECURITY DEFINER` function; pin `SET search_path = public` on any that lack it (notably the early `update_updated_at_column` / `handle_new_user`).
5. Audit `portal_access_attempts` policies — deny `authenticated`/`anon` write access so rate-limit rows can't be tampered with (M4).

## Phase 2 — Portal trigger-gate + zero-knowledge share redesign

Closes C2, C6, H3. This is the biggest change.

New model:
- Every contact with portal access **must** have at least one security question. Portal creation UI enforces this.
- Share bundle is encrypted with a key derived from `PBKDF2(security_answer_normalised, per_share_random_salt, 310_000, SHA-256)`. The URL token is only an identifier/lookup, not key material.
- `contact_shares` gains: `kdf_salt bytea`, `kdf_iterations int`, `security_question_id uuid` (which question's answer decrypts it). Existing rows migrated by nulling ciphertext and marking `needs_regeneration=true`.
- Server stores only ciphertext, salt, iterations, and the SHA-256 hash of the answer (already used for verification). It never learns the answer, so it cannot derive the key.
- Portal endpoint (`contact-portal` verify + verify-answer) enforces: (a) `user_settings.switch_triggered = true` before returning ciphertext; (b) the contact submits the answer, which is verified by hash **and** returned to the browser where the KDF runs client-side and decrypts locally.
- Financial-asset default flips: `visible_to` empty/null ⇒ not shared. Migration nulls existing `visible_to` on financial assets and prompts owners to reconfigure (banner in UI).
- `get-document-url` gains the same `switch_triggered` gate.

Client changes:
- `src/lib/crypto.ts`: replace `deriveKeyFromToken` with `deriveShareKeyFromAnswer(answer, saltB64, iterations)`; drop the static `'legacyvault-contact-salt'` string.
- `src/lib/portalShares.ts`: on create, generate `crypto.getRandomValues(32)` salt, encrypt bundle with the answer-derived key, upload ciphertext + salt + iterations + `security_question_id`.
- Portal page: after answer verification, run the KDF locally and decrypt in-browser.
- Contact management UI: block "generate portal link" until at least one security question exists; explain the new model in the sharing dialog.
- Docs: rewrite `public/crypto-verification.txt` to describe the new share KDF honestly (per-share random salt, 310k iterations, answer-derived, only served after switch trigger).

## Phase 3 — Edge-function auth & safety

Closes C3, C4, C5, H2, H5, M3, M6, Q5, Q6.

1. **`send-notification`** (C3): require either a valid user JWT **or** a header `X-Internal-Secret` matching `NOTIFICATION_INTERNAL_SECRET` (new secret, generated). Update every internal caller (`check-deadlines`, `contact-portal`, `verify-payment`, `EncryptionContext` welcome email) to send it. Add `escapeHtml()` and apply to every interpolated field. Validate `checkInUrl`/`portalBaseUrl` are `https://` on an allow-listed host. Flip `verify_jwt = true` in `config.toml` for the user-triggered path once the split is in.
2. **`check-deadlines`** (C4): if `CRON_SECRET` is unset **or** mismatched, return 401. No silent bypass.
3. **`check-in-via-token`** (C5): store `sha256(token)` in a new `check_in_tokens.token_hash` column, migrate existing rows (hash-and-null), drop `token` after. GET renders an HTML "Confirm check-in" page with a POST form; only POST mutates state. Constant-time hash comparison. Keep `used_at` single-use.
4. **`verify-payment`** (H2): add Stripe webhook `stripe-webhook` for `checkout.session.completed`, verify signature with `STRIPE_WEBHOOK_SECRET`, upsert into a new `processed_stripe_sessions(session_id primary key)` table for idempotency, then update profile. `verify-payment` becomes a thin "did the webhook mark my session paid?" read; success URL carries `?session_id=...`.
5. **CORS** (H5): both payment functions use the shared `getCorsHeaders(req)` allow-list pattern instead of `*`. Extract `ALLOWED_ORIGINS` and `getCorsHeaders` into `supabase/functions/_shared/cors.ts` (Q5) and import everywhere.
6. **Error responses** (Q6): every `catch` returns a generic message (`"Internal error"`) with a short code; full detail goes to `console.error` only.
7. **`.single()` audit** (M6): replace with `.maybeSingle()` where zero rows is legitimate; keep `.single()` only where exactly-one is guaranteed.
8. **Token comparisons** (M3): constant-time compare for portal answer hashes and check-in token hashes. Drop the `isLegacyPlaintext` and raw-token fallback branches (migration window is over after Phase 2's forced regeneration).

## Phase 4 — Client crypto & migration hardening

Closes H4, Q2.

- `migrateUserData`: run per-table with counts, only set `migration_complete = true` when every table reports zero remaining plaintext rows. Surface failure via toast + a persistent banner ("Encryption migration incomplete — contact support"). Make it resumable (idempotent per row).
- Remove the `ab: any` cast in `crypto.ts`; type buffers explicitly as `ArrayBuffer | Uint8Array` and normalise via `new Uint8Array(x).buffer` where needed.

## Phase 5 — Repo hygiene, tooling, DX

Closes M1, M5, Q1, Q3, Q4.

- **`.env`**: `git rm --cached .env`, add to `.gitignore`, commit `.env.example` with blank placeholders. Rotate the Supabase anon key (tool). Client gate on `Admin.tsx` stays as defense-in-depth (M5) — real boundary is the RPC guards from Phase 1.
- **TS strict** (Q1): enable `strict: true` and `strictNullChecks: true` in `tsconfig.app.json`; fix fallout (nullable Supabase rows, optional profile fields). This will touch many files; kept last so earlier phases aren't blocked.
- **ESLint** (Q3): run `--fix`, then work through `react-hooks/exhaustive-deps` (real staleness bugs) and the highest-signal `no-explicit-any` sites in edge functions and crypto/portal code.
- **Bundle split** (Q4): route-level `React.lazy` for `Portal`, `Admin`, `Settings`, `Documents`, `Financials`; add `manualChunks` for `@supabase/*`, `stripe`, `dompurify`.

## Verification

After each phase:
- `bunx tsgo --noEmit`
- Run the SQL linter (`supabase--linter`) after Phase 1 and Phase 3 migrations.
- Playwright smoke test: signup → unlock vault → add contact + security question → generate portal link → simulate switch trigger via admin RPC → open portal, answer question, decrypt bundle.
- `security--run_security_scan` at the end; mark resolved findings via `manage_security_finding` with explanations, and refresh `security--update_memory`.

## Technical notes

- New tables: `processed_stripe_sessions(id text pk, user_id uuid, processed_at timestamptz default now())`. New columns: `contact_shares.kdf_salt bytea`, `contact_shares.kdf_iterations int`, `contact_shares.security_question_id uuid`, `contact_shares.needs_regeneration bool default true`; `check_in_tokens.token_hash bytea unique`.
- New secrets: `NOTIFICATION_INTERNAL_SECRET` (generated), ensure `CRON_SECRET` set (generated if absent).
- Existing users: on next login, banner prompts them to (a) add security questions to any portal-enabled contact, (b) regenerate portal links, (c) reconfigure financial-asset visibility. No data loss; only shares/links break.
- `config.toml`: `send-notification` splits or gates; other functions unchanged.
- All migrations follow the CREATE → GRANT → RLS → POLICY order.
