async function testTesseractImport() {
  const TesseractModule = await import("tesseract.js");
  console.log("Keys on TesseractModule:", Object.keys(TesseractModule));
  console.log("Type of TesseractModule.recognize:", typeof (TesseractModule as any).recognize);
  console.log("Type of TesseractModule.default?.recognize:", typeof (TesseractModule as any).default?.recognize);
}

testTesseractImport().catch(console.error);
