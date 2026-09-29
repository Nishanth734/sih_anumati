import { processDocumentOCR } from "../lib/ocrProcessor";
import { validateDocumentBuffer } from "../lib/documentGuard";

async function testOcrBug1FullTrace() {
  console.log("==========================================================================");
  console.log("             TESTING BUG 1: OCR EXTRACTION FULL TRACE                     ");
  console.log("==========================================================================\n");

  // Create or load a mock PNG buffer with text
  // We can create a simple PNG using pure JS or canvas if canvas is available, or mock canvas
  // Or test what processDocumentOCR does when passed a text/image buffer.

  // 1. Test PDF Text Layer vs Image Buffer
  const pdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Title (PAN Card Apex Steel Works) >>\nendobj\nstream\nINCOME TAX DEPARTMENT GOVT OF INDIA\nNAME: APEX STEEL WORKS PVT LTD\nPAN: ABCDE1234F\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");
  
  console.log("1. Inspecting Magic Bytes of PDF Buffer:");
  console.log("Header (hex):", pdfBuffer.subarray(0, 8).toString("hex").toUpperCase());
  console.log("PDF Validation:", validateDocumentBuffer(pdfBuffer, "application/pdf", "mock_pan_card.pdf"));

  console.log("\n2. Testing processDocumentOCR on PDF Buffer:");
  const pdfOcrResult = await processDocumentOCR(pdfBuffer, "PAN_CARD");
  console.log("Extracted OCR Text snippet:", JSON.stringify(pdfOcrResult.ocrText.substring(0, 150)));
  console.log("Extracted PAN:", pdfOcrResult.extractedFields.pan);
  console.log("Extracted Name:", pdfOcrResult.extractedFields.name);

  console.log("\n==========================================================================");
}

testOcrBug1FullTrace().catch(console.error);
