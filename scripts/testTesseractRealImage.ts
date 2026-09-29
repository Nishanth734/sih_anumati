async function testRealImageOcr() {
  console.log("Testing Tesseract.js recognize on a real image buffer...");
  const TesseractModule = await import("tesseract.js");
  const recognize = TesseractModule.default?.recognize || (TesseractModule as any).recognize;

  if (typeof recognize !== "function") {
    throw new Error("Tesseract.recognize is not a function!");
  }

  console.log("recognize function found successfully! Type:", typeof recognize);
}

testRealImageOcr().catch(console.error);
