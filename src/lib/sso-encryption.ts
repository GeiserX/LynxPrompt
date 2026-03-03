import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits, recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Sensitive fields that must be encrypted at rest
const SENSITIVE_FIELDS = ["clientSecret", "bindPassword"];

interface EncryptedValue {
  encrypted: true;
  iv: string;
  data: string;
  tag: string;
}

function getEncryptionKey(): Buffer | null {
  const keyHex = process.env.SSO_ENCRYPTION_KEY;
  if (!keyHex) {
    console.warn(
      "[SSO] SSO_ENCRYPTION_KEY is not set. SSO secrets will be stored in plaintext. " +
        "Set a 64-character hex string (32 bytes) to enable encryption."
    );
    return null;
  }

  if (keyHex.length !== 64) {
    throw new Error(
      "SSO_ENCRYPTION_KEY must be a 64-character hex string (32 bytes for AES-256)"
    );
  }

  return Buffer.from(keyHex, "hex");
}

function encryptValue(plaintext: string, key: Buffer): EncryptedValue {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag();

  return {
    encrypted: true,
    iv: iv.toString("base64"),
    data: encrypted,
    tag: tag.toString("base64"),
  };
}

function decryptValue(encryptedValue: EncryptedValue, key: Buffer): string {
  const iv = Buffer.from(encryptedValue.iv, "base64");
  const tag = Buffer.from(encryptedValue.tag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedValue.data, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function isEncryptedValue(value: unknown): value is EncryptedValue {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).encrypted === true &&
    typeof (value as Record<string, unknown>).iv === "string" &&
    typeof (value as Record<string, unknown>).data === "string" &&
    typeof (value as Record<string, unknown>).tag === "string"
  );
}

/**
 * Encrypts sensitive fields (clientSecret, bindPassword) within an SSO config object.
 * If SSO_ENCRYPTION_KEY is not set, returns the config unchanged (backward compatible).
 */
export function encryptSSOConfig(
  config: Record<string, unknown>
): Record<string, unknown> {
  const key = getEncryptionKey();
  if (!key) {
    return config;
  }

  const result = { ...config };
  for (const field of SENSITIVE_FIELDS) {
    if (field in result && typeof result[field] === "string") {
      result[field] = encryptValue(result[field] as string, key);
    }
  }
  return result;
}

/**
 * Decrypts sensitive fields (clientSecret, bindPassword) within an SSO config object.
 * If SSO_ENCRYPTION_KEY is not set, or fields are not encrypted, returns them as-is.
 */
export function decryptSSOConfig(
  config: Record<string, unknown>
): Record<string, unknown> {
  const key = getEncryptionKey();
  if (!key) {
    return config;
  }

  const result = { ...config };
  for (const field of SENSITIVE_FIELDS) {
    if (field in result && isEncryptedValue(result[field])) {
      result[field] = decryptValue(result[field] as EncryptedValue, key);
    }
  }
  return result;
}
