/**
 * Document Guard Module
 * Enforces client and server side file validation, 10MB size limits,
 * and magic byte header guards to detect malformed or corrupted files.
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorType?: "VALIDATION_ERROR" | "SANITY_ERROR";
}

/**
 * Validates document buffer size, MIME type, and magic bytes header
 */
export function validateDocumentBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): ValidationResult {
  // 1. File size check
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      error: "Uploaded file is empty (0 bytes).",
      errorType: "VALIDATION_ERROR",
    };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds statutory maximum threshold of 10MB (Received ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`,
      errorType: "VALIDATION_ERROR",
    };
  }

  // 2. MIME type & extension check
  const cleanMime = (mimeType || "").toLowerCase().trim();
  const ext = (fileName.split(".").pop() || "").toLowerCase();

  const isAllowedMime = ALLOWED_MIME_TYPES.includes(cleanMime);
  const isAllowedExt = ["pdf", "jpg", "jpeg", "png"].includes(ext);

  if (!isAllowedMime || !isAllowedExt) {
    return {
      valid: false,
      error: `Invalid file format '.${ext}'. Only statutory PDF, JPG, and PNG files are accepted.`,
      errorType: "VALIDATION_ERROR",
    };
  }

  // 3. Virus / Malformed-File Guard: Magic byte header inspection
  const header = buffer.subarray(0, 8);

  if (cleanMime === "application/pdf" || ext === "pdf") {
    // PDF Magic Bytes: %PDF- (0x25 0x50 0x44 0x46)
    if (
      header.length < 4 ||
      header[0] !== 0x25 ||
      header[1] !== 0x50 ||
      header[2] !== 0x44 ||
      header[3] !== 0x46
    ) {
      return {
        valid: false,
        error: "Malformed file guard triggered: File claims to be PDF but magic bytes header signature '%PDF-' is corrupted.",
        errorType: "SANITY_ERROR",
      };
    }
  } else if (cleanMime === "image/png" || ext === "png") {
    // PNG Magic Bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (
      header.length < 8 ||
      header[0] !== 0x89 ||
      header[1] !== 0x50 ||
      header[2] !== 0x4e ||
      header[3] !== 0x47 ||
      header[4] !== 0x0d ||
      header[5] !== 0x0a ||
      header[6] !== 0x1a ||
      header[7] !== 0x0a
    ) {
      return {
        valid: false,
        error: "Malformed file guard triggered: File claims to be PNG but magic bytes header signature is corrupted.",
        errorType: "SANITY_ERROR",
      };
    }
  } else if (cleanMime === "image/jpeg" || ext === "jpg" || ext === "jpeg") {
    // JPEG Magic Bytes: 0xFF 0xD8 0xFF
    if (header.length < 3 || header[0] !== 0xff || header[1] !== 0xd8 || header[2] !== 0xff) {
      return {
        valid: false,
        error: "Malformed file guard triggered: File claims to be JPEG but magic bytes header signature (0xFFD8FF) is corrupted.",
        errorType: "SANITY_ERROR",
      };
    }
  }

  return { valid: true };
}
