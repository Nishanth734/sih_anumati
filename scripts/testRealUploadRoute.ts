import fs from "fs";
import path from "path";

async function testRealUpload() {
  console.log("=== TESTING REAL DOCUMENT UPLOAD API ROUTE ===");
  const filePath = path.join(process.cwd(), "mock_pan_card_apex_steel_works.png");
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // First log in to get session cookie or auth token
  console.log("1. Authenticating as entrepreneur@company.com...");
  const loginRes = await fetch("http://localhost:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "entrepreneur@company.com",
      password: "Password123!",
    }),
  });

  const cookies = loginRes.headers.get("set-cookie") || "";
  const loginData = await loginRes.json();
  console.log("Login Response:", loginData.success ? "Authenticated Successfully" : loginData);

  // Fetch an application ID directly from DB
  console.log("2. Fetching existing entrepreneur application from DB...");
  const connectDB = require("../lib/db").default;
  const Application = require("../models/Application").default;
  await connectDB();
  const app = await Application.findOne({});
  const applicationId = app?._id?.toString();
  console.log("Target Application ID:", applicationId);

  if (!applicationId) {
    throw new Error("No application found for testing upload!");
  }

  // Upload file via FormData
  console.log("3. Uploading mock_pan_card_apex_steel_works.png to /api/documents/upload...");
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "image/png" });

  const formData = new FormData();
  formData.append("file", blob, "mock_pan_card_apex_steel_works.png");
  formData.append("applicationId", applicationId);
  formData.append("documentType", "PAN_CARD");

  const uploadRes = await fetch("http://localhost:3001/api/documents/upload", {
    method: "POST",
    headers: { cookie: cookies },
    body: formData,
  });

  const uploadResult = await uploadRes.json();
  console.log("\n=== UPLOAD API RESPONSE ===");
  console.log(JSON.stringify(uploadResult, null, 2));
  console.log("===========================");
}

testRealUpload().catch((err) => {
  console.error("Real upload test error:", err);
});
