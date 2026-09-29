async function testPostApplications() {
  console.log("=== TESTING POST /api/applications ===");

  // 1. Login
  const loginRes = await fetch("http://localhost:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "entrepreneur@company.com",
      password: "Password123!",
    }),
  });

  const cookies = loginRes.headers.get("set-cookie") || "";
  console.log("Cookie header obtained:", cookies);

  // 2. Submit application
  const appRes = await fetch("http://localhost:3001/api/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookies,
    },
    body: JSON.stringify({
      title: "50 Ton High Pressure Steam Boiler Operational License",
      sector: "Boiler",
      description: "Installation and hydrostatic pressure testing of 50-ton capacity water tube boiler.",
      estimatedBudget: 15000000,
      plantLocation: "Plot 45, GIDC Industrial Estate, Vadodara",
      submissionMethod: "PDF_TEXT_EXTRACTION",
    }),
  });

  console.log("Response Status:", appRes.status);
  const data = await appRes.json();
  console.log("Response Body:\n", JSON.stringify(data, null, 2));
}

testPostApplications().catch(console.error);
