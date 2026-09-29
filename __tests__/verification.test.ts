import { validateDocumentBuffer, MAX_FILE_SIZE_BYTES } from "@/lib/documentGuard";
import {
  calculateFuzzySimilarity,
  verifyDocumentFields,
  ExtractedDocumentFields,
  VerificationProfileInput,
} from "@/lib/verificationEngine";

describe("Document Upload Guard & Magic Bytes Header Tests", () => {
  it("accepts valid PDF buffer with correct '%PDF-' magic bytes", () => {
    const validPdfBuffer = Buffer.from("%PDF-1.4 sample pdf content for testing...");
    const result = validateDocumentBuffer(validPdfBuffer, "application/pdf", "certificate.pdf");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts valid PNG buffer with correct magic bytes header", () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const result = validateDocumentBuffer(pngHeader, "image/png", "site_plan.png");
    expect(result.valid).toBe(true);
  });

  it("accepts valid JPEG buffer with correct 0xFFD8FF magic bytes", () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const result = validateDocumentBuffer(jpegHeader, "image/jpeg", "scan.jpg");
    expect(result.valid).toBe(true);
  });

  it("rejects files exceeding statutory 10MB size limit with VALIDATION_ERROR", () => {
    const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024);
    const result = validateDocumentBuffer(oversizedBuffer, "application/pdf", "large.pdf");
    expect(result.valid).toBe(false);
    expect(result.errorType).toBe("VALIDATION_ERROR");
    expect(result.error).toContain("exceeds statutory maximum threshold of 10MB");
  });

  it("rejects malformed/corrupted file claiming to be PDF but lacking %PDF- header with SANITY_ERROR", () => {
    const malformedBuffer = Buffer.from("THIS IS PLAIN TEXT RATHER THAN A REAL PDF FILE");
    const result = validateDocumentBuffer(malformedBuffer, "application/pdf", "fake.pdf");
    expect(result.valid).toBe(false);
    expect(result.errorType).toBe("SANITY_ERROR");
    expect(result.error).toContain("Malformed file guard triggered");
  });
});

describe("Fuzzy Match & Verification Engine Hard-Gate Tests", () => {
  it("computes accurate fuzzy similarity scores accounting for minor OCR errors", () => {
    const profileName = "Apex Steel Works Pvt Ltd";
    const ocrExtractedName = "Apex Steel Works Private Limited";

    const similarity = calculateFuzzySimilarity(profileName, ocrExtractedName);
    expect(similarity).toBeGreaterThanOrEqual(0.75);

    const matchIdentical = calculateFuzzySimilarity("Ramesh Traders", "Ramesh Traders");
    expect(matchIdentical).toBe(1.0);

    const matchMismatch = calculateFuzzySimilarity("Ramesh Traders", "Global Software Consultants");
    expect(matchMismatch).toBeLessThan(0.4);
  });

  it("passes verification for completely valid document and profile data", () => {
    const validExtracted: ExtractedDocumentFields = {
      pan: "ABCDE1234F",
      gstin: "27AAACR1234K1ZI",
      name: "Apex Steel Works Pvt Ltd",
      address: "Plot 45 GIDC Industrial Complex Vadodara",
      expiryDate: new Date("2030-12-31"),
    };

    const profile: VerificationProfileInput = {
      companyName: "Apex Steel Works Pvt Ltd",
      registeredAddress: "Plot 45 GIDC Industrial Complex Vadodara",
    };

    const result = verifyDocumentFields("GSTIN_CERTIFICATE", validExtracted, profile);
    expect(result.passed).toBe(true);
    expect(result.failures.length).toBe(0);
  });

  it("fails verification with specific human-readable errors for invalid GSTIN checksum and expired certificate", () => {
    const malformedExtracted: ExtractedDocumentFields = {
      pan: "ABCDE1234F",
      gstin: "27AAACR1234K1ZZ", // Invalid checksum (ends in ZZ instead of 1ZI)
      name: "Apex Steel Works Pvt Ltd",
      expiryDate: new Date("2024-03-12"), // Expired certificate date
    };

    const profile: VerificationProfileInput = {
      companyName: "Apex Steel Works Pvt Ltd",
    };

    const currentDate = new Date("2026-09-27");
    const result = verifyDocumentFields("GSTIN_CERTIFICATE", malformedExtracted, profile, currentDate);

    expect(result.passed).toBe(false);
    expect(result.failures).toHaveLength(2);

    expect(result.failures.some((f) => f.includes("GSTIN Checksum Invalid") && f.includes("failed Modulus 36 checksum calculation"))).toBe(true);
    expect(result.failures.some((f) => f.includes("Document Expired") && f.includes("expired on"))).toBe(true);
  });

  it("fails verification and reports specific mismatch when OCR name or address diverges from profile", () => {
    const mismatchedExtracted: ExtractedDocumentFields = {
      pan: "ABCDE1234F",
      name: "Ramesh Trading Co",
      address: "Industrial Area Delhi",
    };

    const profile: VerificationProfileInput = {
      companyName: "Apex Steel Works Pvt Ltd",
      registeredAddress: "Plot 45 GIDC Industrial Estate Vadodara",
    };

    const result = verifyDocumentFields("PAN_CARD", mismatchedExtracted, profile);

    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("Name mismatch: profile says 'Apex Steel Works Pvt Ltd'"))).toBe(true);
    expect(result.failures.some((f) => f.includes("Address mismatch"))).toBe(true);
  });

  it("flags unreadable low-confidence OCR fields (<70%) and triggers hard-gate failure", () => {
    const lowConfidenceExtracted: ExtractedDocumentFields = {
      pan: "ABCDE1234F",
      lowConfidenceFields: ["pan"], // Flagged OCR field < 70% confidence
    };

    const result = verifyDocumentFields("PAN_CARD", lowConfidenceExtracted);

    expect(result.passed).toBe(false);
    expect(result.failures[0]).toContain("Unreadable Field: OCR confidence for field 'pan' was below");
  });
});
