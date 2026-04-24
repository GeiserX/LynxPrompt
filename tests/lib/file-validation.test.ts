import { describe, it, expect } from "vitest";
import { validateMagicBytes } from "@/lib/file-validation";

describe("validateMagicBytes", () => {
  it("validates JPEG files correctly", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(validateMagicBytes(jpeg, "image/jpeg")).toBe(true);
  });

  it("rejects invalid JPEG magic bytes", () => {
    const notJpeg = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]);
    expect(validateMagicBytes(notJpeg, "image/jpeg")).toBe(false);
  });

  it("validates PNG files correctly", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    expect(validateMagicBytes(png, "image/png")).toBe(true);
  });

  it("rejects invalid PNG magic bytes", () => {
    const notPng = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(validateMagicBytes(notPng, "image/png")).toBe(false);
  });

  it("validates GIF87a files correctly", () => {
    const gif87 = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
    expect(validateMagicBytes(gif87, "image/gif")).toBe(true);
  });

  it("validates GIF89a files correctly", () => {
    const gif89 = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(validateMagicBytes(gif89, "image/gif")).toBe(true);
  });

  it("rejects invalid GIF magic bytes", () => {
    const notGif = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(validateMagicBytes(notGif, "image/gif")).toBe(false);
  });

  it("validates WebP files correctly", () => {
    // RIFF....WEBP
    const webp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // size placeholder
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(validateMagicBytes(webp, "image/webp")).toBe(true);
  });

  it("rejects WebP with missing WEBP signature", () => {
    const badWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x41, 0x56, 0x49, 0x20, // AVI instead of WEBP
    ]);
    expect(validateMagicBytes(badWebp, "image/webp")).toBe(false);
  });

  it("rejects WebP when buffer is too short", () => {
    const short = Buffer.from([0x52, 0x49, 0x46, 0x46]);
    expect(validateMagicBytes(short, "image/webp")).toBe(false);
  });

  it("returns true for unknown MIME types with no signatures defined", () => {
    const data = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(validateMagicBytes(data, "application/pdf")).toBe(true);
    expect(validateMagicBytes(data, "text/plain")).toBe(true);
  });

  it("rejects when buffer is shorter than required bytes", () => {
    const short = Buffer.from([0xff]);
    expect(validateMagicBytes(short, "image/jpeg")).toBe(false);
  });

  it("works with Uint8Array as well as Buffer", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(validateMagicBytes(jpeg, "image/jpeg")).toBe(true);
  });
});
