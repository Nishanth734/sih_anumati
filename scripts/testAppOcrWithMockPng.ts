import fs from "fs";
import path from "path";
import { processDocumentOCR } from "../lib/ocrProcessor";

async function test() {
  const imgPath = path.join(process.cwd(), "public", "uploads", "mock_pan_card_apex_steel_works.png");
  const buffer = fs.readFileSync(imgPath);
  console.log("Reading file:", imgPath, "| Size:", buffer.length);
  const result = await processDocumentOCR(buffer, "PAN_CARD");
  console.log("\n=== Raw OCR Text ===");
  console.log(JSON.stringify(result.ocrText));
  console.log("\n=== Extracted Fields ===");
  console.log(JSON.stringify(result.extractedFields, null, 2));
}

test();
