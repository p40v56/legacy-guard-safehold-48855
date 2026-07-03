/**
 * LegacyVault E2E Encryption Utilities
 * 
 * All encryption uses AES-256-GCM via the Web Crypto API.
 * Keys never leave memory. Only ciphertext reaches the server.
 */

const PBKDF2_ITERATIONS = 310_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/** Normalize any binary buffer to a fresh ArrayBuffer for Web Crypto APIs. */
function toArrayBuffer(view: Uint8Array | ArrayBufferLike): ArrayBuffer {
  if (view instanceof ArrayBuffer) return view;
  const bytes = view instanceof Uint8Array ? view : new Uint8Array(view as ArrayBufferLike);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

// ── Helpers ──────────────────────────────────────────────

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return toArrayBuffer(bytes.buffer);
}

function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return bufferToBase64(toArrayBuffer(salt.buffer));
}

// ── Key Derivation ───────────────────────────────────────

export async function deriveMasterKey(
  password: string,
  saltBase64: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const salt = new Uint8Array(base64ToBuffer(saltBase64));

  const baseKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(passwordBuffer),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derives an AES-GCM key from a raw token string (hex or base64).
 * MUST be byte-for-byte identical on both owner (share creation) and contact (portal) sides.
 */
export async function deriveKeyFromToken(
  rawToken: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(rawToken),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('legacyvault-contact-salt'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Vault Key Generation ─────────────────────────────────

export async function generateVaultKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function generateShareKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(raw);
}

export async function importKey(keyBase64: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(keyBase64);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// ── Encrypt / Decrypt Vault Key with Master Key ──────────

export async function encryptVaultKey(
  vaultKey: CryptoKey,
  masterKey: CryptoKey
): Promise<{ encryptedVaultKey: string; vaultKeyIv: string }> {
  const exported = await crypto.subtle.exportKey('raw', vaultKey);
  const iv = generateIV();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    masterKey,
    exported
  );

  return {
    encryptedVaultKey: bufferToBase64(ciphertext),
    vaultKeyIv: bufferToBase64(toArrayBuffer(iv.buffer)),
  };
}

export async function decryptVaultKey(
  encryptedVaultKeyBase64: string,
  ivBase64: string,
  masterKey: CryptoKey
): Promise<CryptoKey> {
  const ciphertext = base64ToBuffer(encryptedVaultKeyBase64);
  const iv = base64ToBuffer(ivBase64);

  const rawKey = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    ciphertext
  );

  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// ── Text Encryption ──────────────────────────────────────

export async function encryptText(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = generateIV();

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(data)
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(toArrayBuffer(iv.buffer)),
  };
}

export async function decryptText(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ── File Encryption ──────────────────────────────────────

export async function encryptFile(
  buffer: ArrayBuffer,
  key: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; iv: string }> {
  const iv = generateIV();

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    buffer
  );

  return {
    ciphertext: encrypted,
    iv: bufferToBase64(toArrayBuffer(iv.buffer)),
  };
}

export async function decryptFile(
  ciphertext: ArrayBuffer,
  ivBase64: string,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const iv = base64ToBuffer(ivBase64);

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
}

// ── Token Hashing ────────────────────────────────────────

export async function hashToken(tokenBytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(tokenBytes));
  return bufferToBase64(digest);
}

export function generateAccessToken(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function accessTokenToBase64(token: Uint8Array): string {
  return bufferToBase64(toArrayBuffer(token.buffer));
}

export function base64ToAccessToken(b64: string): Uint8Array {
  return new Uint8Array(base64ToBuffer(b64));
}

// ── Batch Field Encryption Helpers ───────────────────────

export async function encryptFields(
  fields: Record<string, string | null | undefined>,
  key: CryptoKey
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};

  for (const [fieldName, value] of Object.entries(fields)) {
    if (value == null || value === '') {
      result[fieldName] = value ?? null;
      result[`${fieldName}_iv`] = null;
    } else {
      const { ciphertext, iv } = await encryptText(value, key);
      result[fieldName] = ciphertext;
      result[`${fieldName}_iv`] = iv;
    }
  }

  return result;
}

export async function decryptFields(
  record: Record<string, any>,
  fieldNames: string[],
  key: CryptoKey
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};

  for (const fieldName of fieldNames) {
    const ciphertext = record[fieldName];
    const iv = record[`${fieldName}_iv`];

    if (!ciphertext || !iv) {
      result[fieldName] = ciphertext ?? null;
    } else {
      try {
        result[fieldName] = await decryptText(ciphertext, iv, key);
      } catch {
        // Return null on decrypt failure — never expose ciphertext to UI
        result[fieldName] = null;
      }
    }
  }

  return result;
}
