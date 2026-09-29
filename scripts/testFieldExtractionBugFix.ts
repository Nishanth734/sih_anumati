import { extractLabeledValueFromText } from "../lib/ocrProcessor";
import { PAN_REGEX, GSTIN_FORMAT_REGEX } from "../lib/validators";

const rawOcrSample = `Registered Business / Firm Name:

APEX STEEL WORKS PVT LTD

Date of Incorporation:
12/05/2015

Permanent Account Number (PAN):

ABCDE1234F

GSTIN:

27AAACR1234K1ZI

Registered Office Address:

Plot 45, GIDC Industrial Estate, Phase 2, Vadodara`;

console.log("=== Testing Field Extraction Logic on Raw OCR Sample ===");
console.log("Raw Input Text:\n", rawOcrSample);

// 1. Company / Firm Name
const companyName = extractLabeledValueFromText(
  rawOcrSample,
  /(?:registered business|firm name|company name|enterprise|applicant firm|unit name|\bcompany\b|\bfirm\b|\bname\b)/i
);

// 2. PAN Number
let panValue = extractLabeledValueFromText(
  rawOcrSample,
  /(?:permanent account number|pan number|pan card|\bpan\b)/i
);
if (panValue) {
  panValue = panValue.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

// 3. GSTIN
let gstinValue = extractLabeledValueFromText(
  rawOcrSample,
  /(?:gstin|gst number|gstin\/uin|\bgstin\b)/i
);
if (gstinValue) {
  gstinValue = gstinValue.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

// 4. Address
const addressValue = extractLabeledValueFromText(
  rawOcrSample,
  /(?:registered office address|plant location|factory site|premises address|unit location|\baddress\b|\bpremises\b|\blocation\b)/i
);

console.log("\n=== Extracted Results ===");
console.log("1. Company / Firm Name:", JSON.stringify(companyName));
console.log("2. PAN Number:", JSON.stringify(panValue), "| Valid PAN:", PAN_REGEX.test(panValue || ""));
console.log("3. GSTIN:", JSON.stringify(gstinValue), "| Valid GSTIN:", GSTIN_FORMAT_REGEX.test(gstinValue || ""));
console.log("4. Registered Office Address:", JSON.stringify(addressValue));

if (
  companyName === "APEX STEEL WORKS PVT LTD" &&
  panValue === "ABCDE1234F" &&
  gstinValue === "27AAACR1234K1ZI" &&
  addressValue === "Plot 45, GIDC Industrial Estate, Phase 2, Vadodara"
) {
  console.log("\n✅ ALL 4 FIELDS EXTRACTED PERFECTLY!");
  process.exit(0);
} else {
  console.error("\n❌ Field extraction verification failed!");
  process.exit(1);
}
