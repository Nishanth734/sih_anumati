import connectDB from "../lib/db";
import { processDocumentOCR } from "../lib/ocrProcessor";
import { verifyDocumentRagCompliance } from "../lib/rag/documentRagVerifier";
import { seedSectorKnowledge } from "../lib/rag/seedKnowledge";
import { validateDocumentBuffer } from "../lib/documentGuard";
import { renderTextToBmp } from "./createMockPanImage";

async function verifyFollowUpBugs() {
  console.log("==========================================================================");
  console.log("          VERIFYING FOLLOW-UP BUG 1 (RAW OCR) & BUG 2 (RAG SCOPE)         ");
  console.log("==========================================================================\n");

  await connectDB();
  await seedSectorKnowledge();

  // --------------------------------------------------------------------------
  // BUG 1 VERIFICATION: Raw OCR Text Extraction & Image Debug Info
  // --------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------");
  console.log("BUG 1 VERIFICATION: Raw Tesseract OCR Output & Image Debug Info");
  console.log("--------------------------------------------------------------------------");

  const lines = [
    "INCOME TAX DEPARTMENT GOVT OF INDIA",
    "NAME: APEX STEEL WORKS PVT LTD",
    "PAN: ABCDE1234F",
  ];

  // Render mock PAN image buffer (24-bit BMP)
  const imageBuffer = renderTextToBmp(lines, 3);
  const magicHeader = imageBuffer.subarray(0, 8).toString("hex").toUpperCase();

  console.log(`[Image Debug Info] File Buffer Size: ${imageBuffer.length} bytes`);
  console.log(`[Image Debug Info] Magic Bytes Header: 0x${magicHeader}`);
  console.log(`[Image Debug Info] Format: 24-bit uncompressed BMP image`);

  const ocrResult = await processDocumentOCR(imageBuffer, "PAN_CARD");

  console.log("\n=================== RAW OCR TEXT RETURNED BY TESSERACT ===================");
  console.log(JSON.stringify(ocrResult.ocrText));
  console.log("==========================================================================");
  console.log(`OCR Confidence Score: ${ocrResult.ocrConfidence}%`);
  console.log(`Extracted PAN Field:  "${ocrResult.extractedFields.pan || "NONE"}"`);
  console.log(`Extracted Name Field: "${ocrResult.extractedFields.name || "NONE"}"`);

  if (!ocrResult.ocrText || ocrResult.ocrText.trim().length === 0) {
    throw new Error("BUG 1 FAILED: Tesseract returned empty OCR text!");
  }

  // --------------------------------------------------------------------------
  // BUG 2 VERIFICATION: Full List of Retrieved RAG Chunks & documentType Metadata
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------");
  console.log("BUG 2 VERIFICATION: Full List of Retrieved RAG Chunks & Metadata");
  console.log("--------------------------------------------------------------------------");

  const ragResult = await verifyDocumentRagCompliance("Boiler", "PAN_CARD", ocrResult.ocrText);

  console.log(`Target Sector: "Boiler" | Target Document Slot: "PAN_CARD"`);
  console.log(`RAG Compliant: ${ragResult.compliant}`);
  console.log(`RAG Reasoning: "${ragResult.reasoning}"`);
  
  console.log("\n=================== FULL LIST OF RETRIEVED RAG CHUNKS ===================");
  ragResult.retrievedRules.forEach((rule, idx) => {
    console.log(`Chunk [${idx + 1}]:`);
    console.log(`  - Chunk ID:      ${rule.chunkId}`);
    console.log(`  - Title:         "${rule.title}"`);
    console.log(`  - Source Rule:   "${rule.sourceRule}"`);
  });
  console.log("==========================================================================");

  const containsFireOrStructural = ragResult.retrievedRules.some((r) =>
    r.title.toLowerCase().includes("fire safety") || r.title.toLowerCase().includes("structural stability")
  );

  if (containsFireOrStructural) {
    throw new Error("BUG 2 FAILED: Irrelevant fire safety or structural site plan chunks were retrieved!");
  }

  console.log("\n✅ ALL FOLLOW-UP BUG VERIFICATIONS COMPLETED SUCCESSFULLY!\n");
}

verifyFollowUpBugs().catch((err) => {
  console.error("❌ Verification error:", err);
  process.exit(1);
});
