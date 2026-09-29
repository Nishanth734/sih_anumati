import { validateDocumentBuffer } from "@/lib/documentGuard";
import { verifyDocumentFields, ExtractedDocumentFields } from "@/lib/verificationEngine";
import { verifyDocumentRagCompliance } from "@/lib/rag/documentRagVerifier";

jest.mock("@/lib/db", () => jest.fn());
jest.mock("@/models/SectorKnowledge", () => ({
  countDocuments: jest.fn().mockResolvedValue(9),
  insertMany: jest.fn().mockResolvedValue([]),
  find: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue([
      {
        sector: "Boiler",
        chunkId: "BLR-RAG-001",
        title: "Boiler Registration & Hydrostatic Pressure Test Requirements",
        category: "Registration & Testing",
        sourceRule: "Indian Boilers Act 1923, Section 6 & 7",
        keywords: ["hydrostatic", "pressure", "test", "mawp"],
        content: "Inspector of Boilers must perform Hydrostatic Test at 1.5 times MAWP.",
      },
    ]),
  }),
}));

describe("End-to-End Document Upload and Dual-Layer Verification Flow", () => {
  it("passes both Hard Rules and RAG Statutory Compliance for a valid Boiler Safety NOC document", async () => {
    // 1. Magic Bytes Upload Guard
    const validPdfBuffer = Buffer.from("%PDF-1.4 Boiler Safety Inspection Certificate MAWP 40 bar hydrostatic test passed");
    const guard = validateDocumentBuffer(validPdfBuffer, "application/pdf", "boiler_safety_noc.pdf");
    expect(guard.valid).toBe(true);

    // 2. Hard Gate Layer 1 (Field Verification)
    const validExtracted: ExtractedDocumentFields = {
      pan: "ABCDE1234F",
      gstin: "27AAACR1234K1ZI",
      name: "Apex Steel Works Pvt Ltd",
      expiryDate: new Date("2030-12-31"),
    };
    const profileInput = {
      companyName: "Apex Steel Works Pvt Ltd",
      pan: "ABCDE1234F",
      gstin: "27AAACR1234K1ZI",
    };
    const hardRuleResult = verifyDocumentFields("SAFETY_NOC", validExtracted, profileInput);
    expect(hardRuleResult.passed).toBe(true);
    expect(hardRuleResult.failures.length).toBe(0);

    // 3. Hard Gate Layer 2 (RAG Statutory Compliance Check)
    const ocrText = "BOILER SAFETY CLEARANCE CERTIFICATE. Working pressure rating MAWP: 40 bar. Hydrostatic test inspection signoff completed by certified inspector. Emergency safety valve calibrated.";
    const ragResult = await verifyDocumentRagCompliance("Boiler", "SAFETY_NOC", ocrText);

    console.log("\n=================== PASSING DOCUMENT VERIFICATION ===================");
    console.log("Hard Rules Passed:       ", hardRuleResult.passed);
    console.log("RAG Statutory Compliant: ", ragResult.compliant);
    console.log("RAG Reasoning:           ", ragResult.reasoning);
    console.log("Retrieved Rules:         ", ragResult.retrievedRules);
    console.log("=====================================================================\n");

    expect(ragResult.compliant).toBe(true);
    expect(ragResult.missing_elements.length).toBe(0);

    // Combined dual-layer status
    const combinedPassed = hardRuleResult.passed && ragResult.compliant;
    expect(combinedPassed).toBe(true);
  });

  it("fails Hard Gate Layer 1 when document contains an expired date and invalid GSTIN checksum", () => {
    const invalidExtracted: ExtractedDocumentFields = {
      pan: "ABCDE1234F",
      gstin: "27AAACR1234K1ZZ", // Invalid checksum
      name: "Apex Steel Works Pvt Ltd",
      expiryDate: new Date("2024-01-01"), // Expired
    };
    const profileInput = {
      companyName: "Apex Steel Works Pvt Ltd",
      gstin: "27AAACR1234K1ZI",
    };

    const hardRuleResult = verifyDocumentFields("GSTIN_CERTIFICATE", invalidExtracted, profileInput, new Date("2026-09-27"));
    
    console.log("\n=================== FAILING HARD RULES VERIFICATION ===================");
    console.log("Hard Rules Passed:   ", hardRuleResult.passed);
    console.log("Hard Rule Failures:  ", hardRuleResult.failures);
    console.log("=======================================================================\n");

    expect(hardRuleResult.passed).toBe(false);
    expect(hardRuleResult.failures.length).toBeGreaterThanOrEqual(2);
    expect(hardRuleResult.failures.some((f) => f.includes("GSTIN Checksum Invalid"))).toBe(true);
    expect(hardRuleResult.failures.some((f) => f.includes("Document Expired"))).toBe(true);
  });

  it("fails Hard Gate Layer 2 (RAG Statutory Compliance) when extracted text lacks required statutory parameters", async () => {
    const ocrTextDeficient = "FACTORY CLEARANCE DOCUMENT. Unit is located at Industrial Zone. General building safety looks good.";
    const ragResult = await verifyDocumentRagCompliance("Boiler", "SITE_PLAN", ocrTextDeficient);

    console.log("\n=================== FAILING RAG COMPLIANCE VERIFICATION ===================");
    console.log("RAG Statutory Compliant: ", ragResult.compliant);
    console.log("RAG Missing Elements:    ", ragResult.missing_elements);
    console.log("RAG Reasoning:           ", ragResult.reasoning);
    console.log("===========================================================================\n");

    expect(ragResult.compliant).toBe(false);
    expect(ragResult.missing_elements.length).toBeGreaterThan(0);

    // Verify dual-layer hard gate rejects document if RAG fails
    const hardRulePassed = true;
    const combinedPassed = hardRulePassed && ragResult.compliant;
    expect(combinedPassed).toBe(false);
  });
});
