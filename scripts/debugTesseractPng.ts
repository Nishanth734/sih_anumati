import fs from "fs";
import path from "path";

async function debugTesseractPng() {
  console.log("==========================================================================");
  console.log("                   DEBUGGING TESSERACT.JS PNG EXTRACTION                  ");
  console.log("==========================================================================\n");

  const TesseractModule = await import("tesseract.js");
  const recognize = TesseractModule.default?.recognize || (TesseractModule as any).recognize;
  const createWorker = TesseractModule.default?.createWorker || (TesseractModule as any).createWorker;

  console.log("1. Tesseract Recognize Function Available:", typeof recognize === "function");
  console.log("2. Tesseract CreateWorker Function Available:", typeof createWorker === "function");

  // Let's test createWorker directly or recognize directly on a simple buffer or test image
  // Create a minimal 1x1 PNG or load a test PNG if available
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG magic bytes
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk length & type
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 width height
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89
  ]);

  console.log("\n3. Testing Tesseract recognize on 1x1 PNG Buffer...");
  try {
    const result = await recognize(pngHeader, "eng", {
      logger: (m: any) => console.log("   [Tesseract Logger]", m.status, m.progress ? `${Math.round(m.progress * 100)}%` : ""),
    });
    console.log("\n4. Raw Tesseract Result:");
    console.log("   Text:", JSON.stringify(result.data.text));
    console.log("   Confidence:", result.data.confidence);
  } catch (err: any) {
    console.error("\n❌ Tesseract recognize ERROR caught:");
    console.error("   Error Name:", err.name);
    console.error("   Error Message:", err.message);
    console.error("   Error Stack:", err.stack);
  }
}

debugTesseractPng().catch(console.error);
