import fs from "fs";
import path from "path";

async function testDocUpload() {
  console.log("=== TESTING DOCUMENT VERIFICATION UPLOAD (/api/documents/upload) ===");

  // 1. Authenticate as entrepreneur@company.com
  console.log("1. Authenticating...");
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
  const cookies = getSetCookie.map((c: string) => c.split(";")[0]).join("; ");

  // 2. Fetch an application ID
  console.log("2. Fetching application ID...");
  const connectDB = require("../lib/db").default;
  const Application = require("../models/Application").default;
  await connectDB();
  const app = await Application.findOne({ sector: "Boiler" });
  const applicationId = app?._id?.toString();

  if (!applicationId) {
    throw new Error("No Boiler application found in database!");
  }
  console.log(`Using Application ID: ${applicationId}`);

  // 3. Upload mock_pan_card_apex_steel_works.png to /api/documents/upload
  console.log("3. Uploading mock_pan_card_apex_steel_works.png to /api/documents/upload slot PAN_CARD...");
  const filePath = path.join(process.cwd(), "mock_pan_card_apex_steel_works.png");
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

  const result = await uploadRes.json();
  console.log("\n=== UPLOAD API RESPONSE STATUS:", uploadRes.status);
  console.log(JSON.stringify(result, null, 2));
}

testDocUpload().catch(console.error);
