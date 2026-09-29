const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");

async function main() {
  const rootDir = process.cwd();
  const outputPath = path.join(rootDir, "debug-ocr-output.txt");

  let imgPath = path.join(rootDir, "mock_pan_card_apex_steel_works.png");
  if (!fs.existsSync(imgPath)) {
    imgPath = path.join(rootDir, "public", "uploads", "mock_pan_card_apex_steel_works.png");
  }

  let fileContent = "";

  try {
    if (!fs.existsSync(imgPath)) {
      throw new Error(`File not found at ${imgPath}`);
    }

    const buffer = fs.readFileSync(imgPath);
    const result = await Tesseract.recognize(buffer, "eng");

    const rawText = result.data ? result.data.text : "";
    const confidence = result.data ? result.data.confidence : 0;

    fileContent = `Raw Recognized Text:\n${rawText}\n\nConfidence Score:\n${confidence}\n\nErrors:\nNone\n`;
  } catch (err) {
    fileContent = `Raw Recognized Text:\n\nConfidence Score:\n0\n\nErrors:\n${err.message}\n${err.stack}\n`;
  }

  fs.writeFileSync(outputPath, fileContent, "utf8");
}

main();
