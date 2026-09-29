import connectDB from "../lib/db";
import { processDocumentOCR } from "../lib/ocrProcessor";
import { verifyDocumentRagCompliance } from "../lib/rag/documentRagVerifier";
import { seedSectorKnowledge } from "../lib/rag/seedKnowledge";
import { renderTextToBmp } from "./createMockPanImage";

async function debugGroqAndFallbackRag() {
  console.log("==========================================================================");
  console.log("     DEBUGGING GROQ RAG PROMPT, CONTEXT & FALLBACK REASONING INCONSISTENCY");
  console.log("==========================================================================\n");

  await connectDB();
  await seedSectorKnowledge();

  // 1. Generate clean mock PAN card image buffer
  const lines = [
    "INCOME TAX DEPARTMENT GOVT OF INDIA",
    "NAME: APEX STEEL WORKS PVT LTD",
    "PAN: ABCDE1234F",
  ];
  const imageBuffer = renderTextToBmp(lines, 3);

  // 2. Perform OCR
  const ocrResult = await processDocumentOCR(imageBuffer, "PAN_CARD");

  console.log("--------------------------------------------------------------------------");
  console.log("1. RAW OCR TEXT EXTRACTED FROM DOCUMENT");
  console.log("--------------------------------------------------------------------------");
  console.log(JSON.stringify(ocrResult.ocrText));
  console.log("--------------------------------------------------------------------------\n");

  // 3. Test RAG Verification for PAN_CARD in FactoryLicense sector (where previous inconsistency appeared)
  console.log("--------------------------------------------------------------------------");
  console.log("2. RUNNING RAG VERIFICATION FOR PAN_CARD (Sector: FactoryLicense)");
  console.log("--------------------------------------------------------------------------");
  
  const ragResultFactory = await verifyDocumentRagCompliance("FactoryLicense", "PAN_CARD", ocrResult.ocrText);

  console.log("\n--- RAG VERIFICATION RESULT (FactoryLicense Sector) ---");
  console.log("Compliant:", ragResultFactory.compliant);
  console.log("Model Used:", ragResultFactory.modelUsed);
  console.log("Reasoning:", JSON.stringify(ragResultFactory.reasoning));
  console.log("Missing Elements:", JSON.stringify(ragResultFactory.missing_elements));
  console.log("Retrieved Rules:");
  ragResultFactory.retrievedRules.forEach((r, i) => {
    console.log(`  [Rule ${i + 1}] ID: ${r.chunkId} | Source: "${r.sourceRule}" | Title: "${r.title}"`);
  });

  // 4. Test RAG Verification for PAN_CARD in Boiler sector
  console.log("\n--------------------------------------------------------------------------");
  console.log("3. RUNNING RAG VERIFICATION FOR PAN_CARD (Sector: Boiler)");
  console.log("--------------------------------------------------------------------------");

  const ragResultBoiler = await verifyDocumentRagCompliance("Boiler", "PAN_CARD", ocrResult.ocrText);

  console.log("\n--- RAG VERIFICATION RESULT (Boiler Sector) ---");
  console.log("Compliant:", ragResultBoiler.compliant);
  console.log("Model Used:", ragResultBoiler.modelUsed);
  console.log("Reasoning:", JSON.stringify(ragResultBoiler.reasoning));
  console.log("Missing Elements:", JSON.stringify(ragResultBoiler.missing_elements));
  console.log("Retrieved Rules:");
  ragResultBoiler.retrievedRules.forEach((r, i) => {
    console.log(`  [Rule ${i + 1}] ID: ${r.chunkId} | Source: "${r.sourceRule}" | Title: "${r.title}"`);
  });

  console.log("\n==========================================================================");
}

debugGroqAndFallbackRag().catch(console.error);
