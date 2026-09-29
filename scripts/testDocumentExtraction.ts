import fs from "fs";
import path from "path";
import { extractApplicationDataFromBuffer } from "../lib/applicationExtractor";

/**
 * Creates a minimal valid Digital PDF with an embedded text stream.
 */
function createDigitalPdfBuffer(): Buffer {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kinds [3 0 R] /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 450 >>
stream
BT
/F1 12 Tf
50 720 Td
(Application Title: Industrial Steam Boiler Clearance Phase-1) Tj
0 -20 Td
(Industry Sector: Boiler Licensing & Safety) Tj
0 -20 Td
(Company Name: Apex Steel Works Pvt Ltd) Tj
0 -20 Td
(Plant Location Address: Plot 45 GIDC Industrial Estate Vadodara) Tj
0 -20 Td
(Estimated Capital Investment: Rs. 15000000) Tj
0 -20 Td
(Technical Description: High pressure 50 ton steam boiler with dual safety valves) Tj
0 -20 Td
(Business Tax PAN: ABCDE1234F) Tj
0 -20 Td
(GSTIN Number: 24ABCDE1234F1Z5) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000130 00000 n 
0000000260 00000 n 
0000000760 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
840
%%EOF`;

  return Buffer.from(pdfContent, "binary");
}

/**
 * Creates a mock scanned image buffer (simulating an image upload or scanned PDF with no text layer).
 */
function createScannedImageBuffer(): Buffer {
  // 1x1 minimal PNG buffer representing a scanned image document without digital text streams
  const pngHeader = "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63000100000500010d0a2d4b0000000049454e44ae426082";
  return Buffer.from(pngHeader, "hex");
}

async function runExtractionTests() {
  console.log("==========================================================================");
  console.log("             ANUMATI DUAL-LAYER DOCUMENT EXTRACTION TEST                  ");
  console.log("==========================================================================\n");

  // TEST 1: Digitally-Typed / Word-Generated PDF (Text Layer Extraction)
  console.log("--------------------------------------------------------------------------");
  console.log("TEST 1: DIGITALLY-TYPED / WORD-GENERATED APPLICATION PDF");
  console.log("--------------------------------------------------------------------------");
  const digitalPdfBuf = createDigitalPdfBuffer();
  const digitalResult = await extractApplicationDataFromBuffer(digitalPdfBuf, "application/pdf", "digital_application_form.pdf");

  console.log(`Extraction Method:    ${digitalResult.extractionMethod}`);
  console.log(`Overall Confidence:   ${digitalResult.overallConfidence}%`);
  console.log("Extracted Fields:");
  console.log(JSON.stringify(digitalResult.extractedFields, null, 2));
  console.log(`Flagged Fields:       ${JSON.stringify(digitalResult.flaggedFields)}`);
  console.log("Raw Extracted Text (First 200 chars):");
  console.log(`"${digitalResult.rawText.substring(0, 200).replace(/\n/g, " ")}..."`);
  console.log("--------------------------------------------------------------------------\n");

  // TEST 2: Scanned / Image-Based Application Document (OCR Extraction)
  console.log("--------------------------------------------------------------------------");
  console.log("TEST 2: SCANNED / IMAGE-BASED APPLICATION DOCUMENT (OCR FALLBACK)");
  console.log("--------------------------------------------------------------------------");
  const scannedBuf = createScannedImageBuffer();
  const scannedResult = await extractApplicationDataFromBuffer(scannedBuf, "image/png", "scanned_boiler_form.png");

  console.log(`Extraction Method:    ${scannedResult.extractionMethod}`);
  console.log(`Overall Confidence:   ${scannedResult.overallConfidence}%`);
  console.log("Extracted Fields:");
  console.log(JSON.stringify(scannedResult.extractedFields, null, 2));
  console.log(`Flagged Fields:       ${JSON.stringify(scannedResult.flaggedFields)} (Marked for Mandatory User Verification)`);
  console.log("--------------------------------------------------------------------------\n");

  console.log("==========================================================================");
  console.log("                   EXTRACTION TEST COMPLETED SUCCESSFULLY                  ");
  console.log("==========================================================================");
}

runExtractionTests().catch(console.error);
