import connectDB from "../lib/db";
import { verifyDocumentFields } from "../lib/verificationEngine";
import { verifyDocumentRagCompliance } from "../lib/rag/documentRagVerifier";

async function testFailingPanCardVerificationUI() {
  console.log("==========================================================================");
  console.log("    TESTING FAILING PAN CARD VERIFICATION UI & DETAILED REASONS           ");
  console.log("==========================================================================\n");

  const failingPanOcrText = `
    INCOME TAX DEPARTMENT
    GOVT OF INDIA
    NAME: XYZ Enterprises Ltd
    PAN: ABCDE12345
    DATE OF ISSUE: 15/01/2020
  `;

  const profile = {
    companyName: "Apex Steel Works Pvt Ltd",
    registeredAddress: "Plot 42, GIDC Industrial Estate, Vadodara, Gujarat",
    pan: "ABCDE1234F",
    gstin: "24ABCDE1234F1Z5",
  };

  // Run Hard Rules Verification
  console.log("1. Running Hard Rules Verification Engine on failing PAN text...");
  const extractedFields = {
    pan: "ABCDE12345", // Invalid 10-char format
    name: "XYZ Enterprises Ltd", // Distinctly mismatched name
  };

  const hardRulesResult = verifyDocumentFields("PAN_CARD", extractedFields, profile);

  console.log(`Hard Rules Passed: ${hardRulesResult.passed}`);
  console.log("Specific Actionable Hard Rules Failures:");
  hardRulesResult.failures.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f}`);
  });

  // Verify Hard Rules failures contain detailed reasons
  const panFailureMsg = hardRulesResult.failures.find((f) => f.toLowerCase().includes("pan format invalid"));
  const nameFailureMsg = hardRulesResult.failures.find((f) => f.includes("Name mismatch"));

  if (!panFailureMsg || !panFailureMsg.includes("expected 10 characters matching")) {
    throw new Error("Hard Rules did not return specific expected vs actual PAN format reason!");
  }
  if (!nameFailureMsg || !nameFailureMsg.includes("profile says 'Apex Steel Works Pvt Ltd'")) {
    throw new Error("Hard Rules did not return specific expected vs actual Name mismatch reason!");
  }

  console.log("\n✅ Hard Rules Failure Messages verified to contain exact, actionable reasons.\n");

  // Run RAG Compliance Verification
  console.log("2. Running RAG Statutory Compliance Verification...");
  const ragResult = await verifyDocumentRagCompliance("Boiler", "PAN_CARD", failingPanOcrText);

  console.log(`RAG Compliant: ${ragResult.compliant}`);
  console.log(`Reasoning: "${ragResult.reasoning}"`);
  console.log("Missing Required Statutory Elements:");
  ragResult.missing_elements.forEach((elem, idx) => {
    console.log(`  [${idx + 1}] ${elem}`);
  });

  if (typeof ragResult.reasoning !== "string" || !Array.isArray(ragResult.missing_elements)) {
    throw new Error("RAG result did not contain reasoning string and missing_elements array!");
  }

  console.log("\n✅ RAG Compliance response verified to contain reasoning string and missing_elements array.\n");

  console.log("==========================================================================");
  console.log("     ALL DETAILED VERIFICATION REASON TESTS COMPLETED SUCCESSFULLY ✅     ");
  console.log("==========================================================================");
}

testFailingPanCardVerificationUI().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
