/**
 * Validate file magic bytes match the declared MIME type.
 * Prevents uploading files with a mismatched Content-Type header.
 */

const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  "image/jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4e, 0x47] }], // \x89PNG
  "image/gif": [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  "image/webp": [
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF at offset 0
    // Also check WEBP at offset 8
  ],
};

export function validateMagicBytes(
  buffer: Buffer | Uint8Array,
  declaredType: string
): boolean {
  const signatures = MAGIC_BYTES[declaredType];
  if (!signatures) return true; // No signatures to check for this type

  // Special handling for WebP: needs RIFF at 0 and WEBP at 8
  if (declaredType === "image/webp") {
    if (buffer.length < 12) return false;
    const isRIFF =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    const isWEBP =
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;
    return isRIFF && isWEBP;
  }

  return signatures.some((sig) => {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) return false;
    return sig.bytes.every((byte, i) => buffer[offset + i] === byte);
  });
}
