import { PAN_REGEX, isValidGSTINChecksum } from "@/lib/validators";

/**
 * Computes Levenshtein Distance between two strings
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Deletion
        dp[i][j - 1] + 1, // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Normalizes strings and computes similarity score between 0.0 and 1.0
 */
export function calculateFuzzySimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const n1 = normalize(str1);
  const n2 = normalize(str2);

  if (n1 === n2) return 1.0;
  if (!n1 || !n2) return 0;

  const maxLength = Math.max(n1.length, n2.length);
  if (maxLength === 0) return 1.0;

  const dist = levenshteinDistance(n1, n2);
  return 1 - dist / maxLength;
}

export interface VerificationProfileInput {
  companyName?: string;
  name?: string;
  registeredAddress?: string;
  pan?: string;
  gstin?: string;
}

export interface ExtractedDocumentFields {
  pan?: string;
  gstin?: string;
  name?: string;
  address?: string;
  issueDate?: Date | string;
  expiryDate?: Date | string;
  ocrConfidence?: number;
  lowConfidenceFields?: string[];
}

export interface VerificationResult {
  passed: boolean;
  failures: string[];
  fieldResults: {
    panValid?: boolean;
    gstinValid?: boolean;
    notExpired?: boolean;
    nameSimilarity?: number;
    addressSimilarity?: number;
  };
}

/**
 * Hard Gate Verification Engine
 * Executes field-level compliance checks, GSTIN Modulus 36 checksums, expiry date verification,
 * OCR low-confidence checks (<70%), and profile fuzzy matching against entrepreneur details.
 */
export function verifyDocumentFields(
  documentType: "PAN_CARD" | "GSTIN_CERTIFICATE" | "SITE_PLAN" | "SAFETY_NOC" | "OTHER",
  extracted: ExtractedDocumentFields,
  profile?: VerificationProfileInput,
  currentDate: Date = new Date()
): VerificationResult {
  const failures: string[] = [];
  const fieldResults: VerificationResult["fieldResults"] = {};

  // 1. OCR Low Confidence Guard (< 70%)
  if (extracted.lowConfidenceFields && extracted.lowConfidenceFields.length > 0) {
    extracted.lowConfidenceFields.forEach((field) => {
      failures.push(
        `Unreadable Field: OCR confidence for field '${field}' was below the 70% minimum readability threshold.`
      );
    });
  }

  // 2. Document Expiry Date Check
  if (extracted.expiryDate) {
    const expDate = new Date(extracted.expiryDate);
    if (!isNaN(expDate.getTime())) {
      if (expDate < currentDate) {
        fieldResults.notExpired = false;
        failures.push(
          `Document Expired: Statutory certificate expired on ${expDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })} (current date: ${currentDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}).`
        );
      } else {
        fieldResults.notExpired = true;
      }
    }
  }

  // 3. Document-Type Specific Verification
  if (documentType === "PAN_CARD" || extracted.pan) {
    const pan = extracted.pan ? extracted.pan.trim().toUpperCase() : "";
    if (!pan || !PAN_REGEX.test(pan)) {
      fieldResults.panValid = false;
      failures.push(
        `PAN Format Invalid: expected 10 characters matching [A-Z]{5}[0-9]{4}[A-Z], got '${pan || "NONE"}'`
      );
    } else {
      fieldResults.panValid = true;
    }
  }

  if (documentType === "GSTIN_CERTIFICATE" || extracted.gstin) {
    const gstin = extracted.gstin ? extracted.gstin.trim().toUpperCase() : "";
    if (!gstin || !isValidGSTINChecksum(gstin)) {
      fieldResults.gstinValid = false;
      failures.push(
        `GSTIN Checksum Invalid: Extracted GSTIN '${gstin || "NONE"}' failed Modulus 36 checksum calculation (expected 15 characters matching state code and checksum).`
      );
    } else {
      fieldResults.gstinValid = true;
    }
  }

  // 4. Cross-Match Name & Address against Entrepreneur Profile (Fuzzy Match)
  if (profile) {
    const targetName = profile.companyName || profile.name || "";
    if (extracted.name && targetName) {
      const similarity = calculateFuzzySimilarity(targetName, extracted.name);
      fieldResults.nameSimilarity = Math.round(similarity * 100);

      // Name similarity threshold: 75% (0.75)
      if (similarity < 0.75) {
        failures.push(
          `Name mismatch: profile says '${targetName}', document reads '${extracted.name}' (fuzzy match: ${Math.round(
            similarity * 100
          )}%, minimum required: 75%)`
        );
      }
    } else if (targetName && !extracted.name && documentType === "PAN_CARD") {
      failures.push(
        `Name mismatch: profile says '${targetName}', but no matching entity/firm name could be extracted from document`
      );
    }

    if (extracted.address && profile.registeredAddress) {
      const similarity = calculateFuzzySimilarity(profile.registeredAddress, extracted.address);
      fieldResults.addressSimilarity = Math.round(similarity * 100);

      // Address similarity threshold: 60% (0.60)
      if (similarity < 0.60) {
        failures.push(
          `Address mismatch: profile registered address '${profile.registeredAddress}', document reads '${extracted.address}' (fuzzy match: ${Math.round(
            similarity * 100
          )}%, minimum required: 60%)`
        );
      }
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    fieldResults,
  };
}
