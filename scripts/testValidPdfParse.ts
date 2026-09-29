const validPdfString = `%PDF-1.4
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
<< /Length 120 >>
stream
BT
/F1 12 Tf
100 700 Td
(INCOME TAX DEPARTMENT GOVT OF INDIA) Tj
0 -20 Td
(NAME: APEX STEEL WORKS PVT LTD) Tj
0 -20 Td
(PAN: ABCDE1234F) Tj
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
0000000125 00000 n 
0000000253 00000 n 
0000000424 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
500
%%EOF`;

async function testPdfParse() {
  const pdfParseModule = require("pdf-parse");
  console.log("pdfParseModule exports:", Object.keys(pdfParseModule));

  if (typeof pdfParseModule.PDFParse === "function") {
    const uint8 = new Uint8Array(Buffer.from(validPdfString));
    const parser = new pdfParseModule.PDFParse(uint8);
    await parser.load();
    const result = await parser.getText();
    console.log("Extracted PDF text via PDFParse:", JSON.stringify(result));
  }
}

testPdfParse().catch(console.error);
