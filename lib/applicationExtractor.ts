import { processDocumentOCR, extractLabeledValueFromText } from "@/lib/ocrProcessor";
import { PAN_REGEX, GSTIN_FORMAT_REGEX } from "@/lib/validators";

const pdfParseModule = require("pdf-parse");

export interface ExtractedApplicationData {
  extractionMethod: "PDF_TEXT_EXTRACTION" | "OCR";
  overallConfidence: number; // 0 to 100
  extractedFields: {
    title?: string;
    sector?: "Boiler" | "Pollution" | "FactoryLicense";
    companyName?: string;
    plantLocation?: string;
    estimatedBudget?: number;
    description?: string;
    pan?: string;
    gstin?: string;
  };
  flaggedFields: string[]; // List of field names requiring manual verification
  rawText: string;
}

async function extractPdfTextLayer(buffer: Buffer): Promise<string> {
  try {
    if (typeof pdfParseModule.PDFParse === "function") {
      const uint8 = new Uint8Array(buffer);
      const parser = new pdfParseModule.PDFParse(uint8);
      await parser.load();
      const result = await parser.getText();
      return typeof result === "string" ? result : result?.text || "";
    } else if (typeof pdfParseModule === "function") {
      const result = await pdfParseModule(buffer);
      return result?.text || "";
    }
  } catch (err) {
    console.warn("[ApplicationExtractor] PDF text layer parse error:", err);
  }
  return "";
}

/**
 * Dual-Layer Application Document Extractor.
 * 1. Prioritizes PDF direct text-layer extraction for digital/Word-generated PDFs.
 * 2. Falls back to Tesseract OCR for scanned/image-based PDFs or raw images.
 * 3. Extracts structured application fields and flags low-confidence (<70%) or unparsed fields.
 */
export async function extractApplicationDataFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractedApplicationData> {
  let rawText = "";
  let extractionMethod: "PDF_TEXT_EXTRACTION" | "OCR" = "OCR";
  let overallConfidence = 75;

  const isPdf = mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");

  // Step 1: Direct Text Layer Extraction for Typed / Digital PDFs
  if (isPdf) {
    const text = (await extractPdfTextLayer(buffer)).trim();
    if (text.length > 30) {
      rawText = text;
      extractionMethod = "PDF_TEXT_EXTRACTION";
      overallConfidence = 98; // Digital text extraction is near-100% accurate
    }
  }

  // Step 2: Fallback to OCR (for scanned / image PDFs or image uploads)
  if (!rawText) {
    try {
      const ocrResult = await processDocumentOCR(buffer, "OTHER");
      rawText = ocrResult.ocrText || "";
      overallConfidence = ocrResult.ocrConfidence || 68;
      extractionMethod = "OCR";
    } catch (ocrErr) {
      console.error("[ApplicationExtractor] OCR processing error:", ocrErr);
      rawText = buffer.toString("utf8");
      overallConfidence = 50;
      extractionMethod = "OCR";
    }
  }

  // Step 3: Structured Pattern Parsing
  const extractedFields: ExtractedApplicationData["extractedFields"] = {};
  const flaggedFields: string[] = [];

  // A. Sector Detection
  const lowerText = rawText.toLowerCase();
  if (lowerText.includes("boiler") || lowerText.includes("steam") || lowerText.includes("pressure vessel")) {
    extractedFields.sector = "Boiler";
  } else if (
    lowerText.includes("pollution") ||
    lowerText.includes("effluent") ||
    lowerText.includes("cte") ||
    lowerText.includes("cto") ||
    lowerText.includes("etp") ||
    lowerText.includes("spcb")
  ) {
    extractedFields.sector = "Pollution";
  } else if (
    lowerText.includes("factory") ||
    lowerText.includes("building plan") ||
    lowerText.includes("dish") ||
    lowerText.includes("machinery")
  ) {
    extractedFields.sector = "FactoryLicense";
  } else {
    extractedFields.sector = "Boiler"; // Default fallback
    flaggedFields.push("sector");
  }

  const cleanStr = (val: string) => val.replace(/\)\s*Tj$/i, "").trim();

  // B. Application Title
  let titleCandidate = extractLabeledValueFromText(rawText, /(?:application title|title|purpose|subject|clearance for|license type)/i);
  if (titleCandidate) {
    extractedFields.title = cleanStr(titleCandidate);
  } else {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 5);
    const headerLine = lines.find((l) => /license|clearance|noc|approval|permit/i.test(l));
    if (headerLine) {
      extractedFields.title = cleanStr(headerLine.substring(0, 80));
    } else {
      extractedFields.title = `${extractedFields.sector} Industrial Clearance License`;
      flaggedFields.push("title");
    }
  }

  // C. Company / Firm Name
  let companyCandidate = extractLabeledValueFromText(rawText, /(?:registered business|company name|firm name|enterprise|m\/s|applicant firm|unit name)/i);
  if (companyCandidate) {
    extractedFields.companyName = cleanStr(companyCandidate);
  } else {
    flaggedFields.push("companyName");
  }

  // D. Plant Location Address
  let locationCandidate = extractLabeledValueFromText(rawText, /(?:registered office address|plant location|factory site|premises address|unit location|\baddress\b)/i);
  if (locationCandidate) {
    extractedFields.plantLocation = cleanStr(locationCandidate);
  } else {
    flaggedFields.push("plantLocation");
  }

  // E. Estimated Budget
  let budgetCandidate = extractLabeledValueFromText(rawText, /(?:estimated budget|capital investment|project cost|budget|investment|cost)/i);
  if (!budgetCandidate) {
    const budgetMatch = rawText.match(/(?:estimated budget|capital investment|project cost|budget|investment|cost)\s*[:\-]?\s*(?:rs\.?|inr)?\s*([\d,]{4,15})/i);
    if (budgetMatch) budgetCandidate = budgetMatch[1];
  }
  if (budgetCandidate) {
    const numericStr = budgetCandidate.replace(/[^\d]/g, "");
    const parsedVal = parseInt(numericStr, 10);
    if (!isNaN(parsedVal) && parsedVal > 0) {
      extractedFields.estimatedBudget = parsedVal;
    } else {
      flaggedFields.push("estimatedBudget");
    }
  } else {
    flaggedFields.push("estimatedBudget");
  }

  // F. Technical Description
  let descCandidate = extractLabeledValueFromText(rawText, /(?:technical description|description|details|scope of work|equipment specs)/i);
  if (descCandidate) {
    extractedFields.description = cleanStr(descCandidate);
  } else {
    extractedFields.description = `Application for ${extractedFields.title || "industrial clearance"}. Extracted from document.`;
    flaggedFields.push("description");
  }

  // G. PAN & GSTIN
  let panCandidate = extractLabeledValueFromText(rawText, /(?:permanent account number|pan number|pan card|\bpan\b)/i);
  if (!panCandidate) {
    const panMatch = rawText.match(/([A-Z]{5}[0-9]{4}[A-Z]{1})/);
    if (panMatch) panCandidate = panMatch[1];
  }
  if (panCandidate) {
    const cleanPan = panCandidate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (PAN_REGEX.test(cleanPan)) {
      extractedFields.pan = cleanPan;
    }
  }

  let gstinCandidate = extractLabeledValueFromText(rawText, /(?:gstin|gst number|gstin\/uin|\bgstin\b)/i);
  if (!gstinCandidate) {
    const gstinMatch = rawText.match(/([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/);
    if (gstinMatch) gstinCandidate = gstinMatch[1];
  }
  if (gstinCandidate) {
    const cleanGstin = gstinCandidate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (GSTIN_FORMAT_REGEX.test(cleanGstin)) {
      extractedFields.gstin = cleanGstin;
    }
  }

  // Step 4: Low Confidence Field Flagging Threshold (<70%)
  if (extractionMethod === "OCR" || overallConfidence < 70) {
    // If OCR overall confidence is < 70%, flag ALL key fields for mandatory user verification
    ["title", "sector", "estimatedBudget", "plantLocation", "description"].forEach((field) => {
      if (!flaggedFields.includes(field)) {
        flaggedFields.push(field);
      }
    });
  }

  return {
    extractionMethod,
    overallConfidence,
    extractedFields,
    flaggedFields,
    rawText,
  };
}
