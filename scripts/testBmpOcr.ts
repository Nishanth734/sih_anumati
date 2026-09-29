import { renderTextToBmp } from "./createMockPanImage";
import { processDocumentOCR } from "../lib/ocrProcessor";

async function testBmpOcr() {
  console.log("==========================================================================");
  console.log("             TESTING BMP IMAGE GENERATION & TESSERACT OCR                 ");
  console.log("==========================================================================\n");

  const lines = [
    "INCOME TAX DEPARTMENT GOVT OF INDIA",
    "NAME: APEX STEEL WORKS PVT LTD",
    "PAN: ABCDE1234F",
  ];

  const bmpBuffer = renderTextToBmp(lines, 4);

  console.log("1. Generated BMP Buffer Size:", bmpBuffer.length, "bytes");
  console.log("2. Magic Bytes Header (hex):", bmpBuffer.subarray(0, 8).toString("hex").toUpperCase());

  // Pass to processDocumentOCR
  console.log("\n3. Calling processDocumentOCR on BMP image buffer...");
  const result = await processDocumentOCR(bmpBuffer, "PAN_CARD");

  console.log("\n--- RAW TESSERACT OCR OUTPUT RESULT ---");
  console.log(JSON.stringify(result.ocrText));
  console.log("OCR Confidence:", result.ocrConfidence);
  console.log("Extracted PAN Field:", result.extractedFields.pan);
  console.log("Extracted Name Field:", result.extractedFields.name);
}

testBmpOcr().catch(console.error);
