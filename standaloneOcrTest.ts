import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";

async function runStandaloneOcrTest() {
  console.log("=== STANDALONE TESSERACT OCR TEST ===");
  const filePath = path.join(process.cwd(), "mock_pan_card_apex_steel_works.png");
  console.log(`Loading image from: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const imageBuffer = fs.readFileSync(filePath);
  console.log(`Image size: ${imageBuffer.length} bytes`);

  const result = await Tesseract.recognize(imageBuffer, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        console.log(`[Tesseract Logger] Progress: ${Math.round((m.progress || 0) * 100)}%`);
      }
    }
  });

  console.log("\n=== STANDALONE OCR RESULT ===");
  console.log("Raw Recognized Text:");
  console.log(JSON.stringify(result.data.text));
  console.log("Clean Text:");
  console.log(result.data.text);
  console.log(`Confidence Score: ${result.data.confidence}`);
  console.log("===============================");
}

runStandaloneOcrTest().catch((err) => {
  console.error("Standalone OCR Test Error:", err);
});
