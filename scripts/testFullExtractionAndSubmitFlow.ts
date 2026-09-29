import fs from "fs";
import path from "path";

async function runFullFlowTest() {
  console.log("=== FULL FLOW TEST: EXTRACTION -> APPLICATION SUBMISSION ===");

  // Step 1: Login
  console.log("\n1. Logging in as entrepreneur@company.com...");
  const loginRes = await fetch("http://localhost:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "entrepreneur@company.com",
      password: "Password123!",
    }),
  });

  const getSetCookie = (loginRes.headers as any).getSetCookie
    ? (loginRes.headers as any).getSetCookie()
    : [loginRes.headers.get("set-cookie")];
  const cookieHeader = getSetCookie.map((c: string) => c.split(";")[0]).join("; ");

  console.log(`Login Status: ${loginRes.status}`);
  console.log(`Session Cookie Header: "${cookieHeader}"`);

  // Step 2: Extract Application Data from Document
  console.log("\n2. Extracting fields from mock_pan_card_apex_steel_works.png via /api/applications/extract...");
  const filePath = path.join(process.cwd(), "mock_pan_card_apex_steel_works.png");
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "image/png" });

  const extractFormData = new FormData();
  extractFormData.append("file", blob, "mock_pan_card_apex_steel_works.png");

  const extractRes = await fetch("http://localhost:3001/api/applications/extract", {
    method: "POST",
    headers: { cookie: cookieHeader },
    body: extractFormData,
  });

  const extractJson = await extractRes.json();
  console.log(`Extraction API Status: ${extractRes.status}`);
  console.log("Extraction API Response Data:", JSON.stringify(extractJson.data, null, 2));

  const extractedFields = extractJson.data?.extractedFields || {};

  // Step 3: Create New Application with Extracted Data
  console.log("\n3. Submitting new application to /api/applications...");
  const applicationPayload = {
    title: extractedFields.title || "Boiler Safety Clearance Application",
    sector: extractedFields.sector || "Boiler",
    description: extractedFields.description || "High pressure steam boiler installation and statutory inspection clearance.",
    estimatedBudget: extractedFields.estimatedBudget || 15000000,
    plantLocation: extractedFields.plantLocation || "Plot 45, GIDC Industrial Estate, Vadodara",
    submissionMethod: extractJson.data?.extractionMethod || "OCR",
  };

  const submitRes = await fetch("http://localhost:3001/api/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify(applicationPayload),
  });

  console.log(`\n=== APPLICATION SUBMISSION RESPONSE STATUS: ${submitRes.status} ===`);
  const submitData = await submitRes.json();
  console.log("Exact Response Body:\n", JSON.stringify(submitData, null, 2));
  console.log("=================================================");
}

runFullFlowTest().catch(console.error);
