import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    for (const line of envConfig.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = value.trim();
        }
      }
    }
  }
} catch (e) {
  // Fallback to default MONGODB_URI if .env.local cannot be read
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/anumati";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  sector: { type: String, required: true },
  pan: String,
  companyName: String,
  businessAddress: String,
  employeeId: String,
}, { timestamps: true });

const EntrepreneurProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  companyName: { type: String, required: true },
  pan: { type: String, required: true },
  gstin: { type: String, required: true },
  registeredAddress: { type: String, required: true },
  sector: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
}, { timestamps: true });

const ApplicationSchema = new mongoose.Schema({
  applicationNumber: { type: String, required: true, unique: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  applicantName: { type: String, required: true },
  companyName: { type: String, required: true },
  sector: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  estimatedBudget: { type: Number, required: true },
  plantLocation: { type: String, required: true },
  status: { type: String, default: "PENDING" },
  assignedOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  remarks: String,
}, { timestamps: true });

const SectorRoadmapSchema = new mongoose.Schema({
  sector: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  orderedSteps: [
    {
      stepNumber: { type: Number, required: true },
      stepCode: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      department: { type: String, required: true },
      requiredDocuments: [String],
      estimatedProcessingTime: { type: String, required: true },
    },
  ],
}, { timestamps: true });

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userEmail: String,
  role: String,
  sector: String,
  targetId: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const EntrepreneurProfile = mongoose.models.EntrepreneurProfile || mongoose.model("EntrepreneurProfile", EntrepreneurProfileSchema);
const Application = mongoose.models.Application || mongoose.model("Application", ApplicationSchema);
const SectorRoadmap = mongoose.models.SectorRoadmap || mongoose.model("SectorRoadmap", SectorRoadmapSchema);
const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

async function seed() {
  console.log("🌱 Connecting to MongoDB Atlas / Local MongoDB at:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log("🧹 Cleaning up existing collections...");
  await User.deleteMany({});
  await EntrepreneurProfile.deleteMany({});
  await Application.deleteMany({});
  await SectorRoadmap.deleteMany({});
  await AuditLog.deleteMany({});

  console.log("🔐 Hashing passwords with cost factor 12...");
  const hashedPassword = await bcrypt.hash("Password123!", 12);

  console.log("👤 Creating seed users & profile...");

  // 1. Entrepreneur User
  const entrepreneur = await User.create({
    name: "Rajesh Sharma",
    email: "entrepreneur@company.com",
    password: hashedPassword,
    role: "entrepreneur",
    sector: "Boiler",
    pan: "ABCDE1234F",
    companyName: "Apex Steel Works Pvt Ltd",
    businessAddress: "Plot 45, GIDC Industrial Estate, Phase 2, Vadodara",
  });

  // Entrepreneur Profile
  await EntrepreneurProfile.create({
    userId: entrepreneur._id,
    companyName: "Apex Steel Works Pvt Ltd",
    pan: "ABCDE1234F",
    gstin: "27AAACR1234K1ZI",
    registeredAddress: "Plot 45, GIDC Industrial Estate, Phase 2, Vadodara",
    sector: "Boiler",
    phone: "9876543210",
    email: "entrepreneur@company.com",
  });

  // 2. Officers for each Sector
  const boilerOfficer = await User.create({
    name: "Dr. Vikram Seth",
    email: "officer.boiler@gov.in",
    password: hashedPassword,
    role: "officer",
    sector: "Boiler",
    employeeId: "GOV-OFF-101",
  });

  const pollutionOfficer = await User.create({
    name: "Meera Nair",
    email: "officer.pollution@gov.in",
    password: hashedPassword,
    role: "officer",
    sector: "Pollution",
    employeeId: "GOV-OFF-102",
  });

  const factoryOfficer = await User.create({
    name: "Suresh Kumar",
    email: "officer.factory@gov.in",
    password: hashedPassword,
    role: "officer",
    sector: "FactoryLicense",
    employeeId: "GOV-OFF-103",
  });

  console.log("🗺️ Seeding realistic Sector Roadmaps...");
  await SectorRoadmap.create([
    {
      sector: "Boiler",
      title: "High Pressure Steam Boiler Operating & Safety Clearance Roadmap",
      description: "Statutory 4-stage sequential approval workflow under Indian Boilers Act 1923 & Indian Boiler Regulations.",
      orderedSteps: [
        {
          stepNumber: 1,
          stepCode: "SITE_CLEARANCE",
          title: "Stage 1: Factory Site & Boiler Layout Clearance",
          description: "Preliminary site inspection, clear distances from flammable storage, and foundation structural safety clearance.",
          department: "Directorate of Steam Boilers",
          requiredDocuments: [
            "Approved Factory Site Layout Plan",
            "Land Ownership / Lease Agreement",
            "Pollution Control Board CTE Copy",
            "Structural Engineer Distance Safety Certificate",
          ],
          estimatedProcessingTime: "5 - 7 Working Days",
        },
        {
          stepNumber: 2,
          stepCode: "DESIGN_REGISTRATION",
          title: "Stage 2: Boiler Design Registration & Pressure Vessel Audit",
          description: "Verification of boiler drawings, design pressure rating calculations, and boiler maker material certificates (Form II & III).",
          department: "Chief Inspectorate of Boilers",
          requiredDocuments: [
            "Manufacturer Form II & III Certificates",
            "Boiler Drawing Specification Sheet",
            "Material Test Reports (Plate & Pipe)",
            "Qualified Welder Inspection Logs",
          ],
          estimatedProcessingTime: "7 - 10 Working Days",
        },
        {
          stepNumber: 3,
          stepCode: "HYDROSTATIC_TESTING",
          title: "Stage 3: Erection & Hydrostatic Pressure Testing",
          description: "On-site hydraulic test at 1.5x working pressure overseen by certified Boiler Inspector prior to insulation.",
          department: "Regional Boiler Inspection Division",
          requiredDocuments: [
            "Inspector Appointment Request",
            "Hydraulic Test Log Sheet",
            "Safety Relief Valve Calibration Certificate",
            "Steam Pipeline NDT Radiography Report",
          ],
          estimatedProcessingTime: "3 - 5 Working Days",
        },
        {
          stepNumber: 4,
          stepCode: "FINAL_LICENSE",
          title: "Stage 4: Operational License & Registry Entry (Form VI)",
          description: "Final statutory registration and issuance of Form VI Certificate authorizing commercial steam generation.",
          department: "Directorate of Steam Boilers",
          requiredDocuments: [
            "Final Inspection Clearance Signoff",
            "Certified Boiler Attendant / Engineer Details",
            "Statutory Treasury Fee Payment Receipt",
          ],
          estimatedProcessingTime: "2 - 4 Working Days",
        },
      ],
    },
    {
      sector: "Pollution",
      title: "State Pollution Control Board Consent & Environmental Approval Roadmap",
      description: "Mandatory multi-tier clearance sequence under Air (Prevention & Control of Pollution) Act 1981 & Water Act 1974.",
      orderedSteps: [
        {
          stepNumber: 1,
          stepCode: "CTE_CLEARANCE",
          title: "Stage 1: Consent to Establish (CTE)",
          description: "Initial sanction to construct industrial unit, verify effluent treatment plant (ETP) capacity and stack height designs.",
          department: "State Pollution Control Board (SPCB)",
          requiredDocuments: [
            "Comprehensive Project Report",
            "Site Location Map with Distance to Rivers/Habitation",
            "Effluent Treatment Plant (ETP/STP) Flow Diagram",
            "Raw Material & Chemical Consumption List",
          ],
          estimatedProcessingTime: "10 - 15 Working Days",
        },
        {
          stepNumber: 2,
          stepCode: "EIA_AUDIT",
          title: "Stage 2: Environmental Impact Assessment & Ambient Air Baseline",
          description: "Baseline environmental quality assessment, ambient air monitoring, and public consultation for Category A/B projects.",
          department: "State Level Environment Impact Assessment Authority (SEIAA)",
          requiredDocuments: [
            "Draft Environmental Impact Assessment (EIA) Report",
            "Ambient Air & Ground Water Sampling Test Reports",
            "Public Hearing Record & Minutes",
            "Risk Assessment & Emergency Response Plan",
          ],
          estimatedProcessingTime: "15 - 20 Working Days",
        },
        {
          stepNumber: 3,
          stepCode: "CTO_CLEARANCE",
          title: "Stage 3: Consent to Operate (CTO)",
          description: "Pre-commissioning compliance audit to verify operational ETP performance and chimney emission controls.",
          department: "State Pollution Control Board (SPCB)",
          requiredDocuments: [
            "CTE Compliance Report",
            "ETP Commissioning & Water Trial Test Results",
            "Chimney Stack Emission Sampling Certificate",
            "Hazardous Waste Storage Facility Layout",
          ],
          estimatedProcessingTime: "7 - 10 Working Days",
        },
        {
          stepNumber: 4,
          stepCode: "HAZARDOUS_AUTHORIZATION",
          title: "Stage 4: Hazardous Waste Authorization & OCEMS Integration",
          description: "Issuance of Form 2 Authorization and real-time portal integration for Online Continuous Emission Monitoring.",
          department: "Hazardous Waste Cell, SPCB",
          requiredDocuments: [
            "Hazardous Waste Management Agreement with TSDF Vendor",
            "Form 1 Authorization Application",
            "OCEMS Data Transmission Test Signoff",
          ],
          estimatedProcessingTime: "5 - 7 Working Days",
        },
      ],
    },
    {
      sector: "FactoryLicense",
      title: "Industrial Factory Registration & Worker Safety Clearance Roadmap",
      description: "Sequential regulatory compliance under the Factories Act 1948 & State Factory Rules.",
      orderedSteps: [
        {
          stepNumber: 1,
          stepCode: "BUILDING_PLAN",
          title: "Stage 1: Factory Plan & Building Layout Approval",
          description: "Approval of factory building plans, structural stability, ventilation, and emergency egress routing.",
          department: "Department of Industrial Safety & Health (DISH)",
          requiredDocuments: [
            "Architectural Structural Layout Drawings",
            "Fire Safety Department NoC",
            "Land Allocation / Revenue Clearance Document",
            "Power Availability NOC",
          ],
          estimatedProcessingTime: "7 - 10 Working Days",
        },
        {
          stepNumber: 2,
          stepCode: "ELECTRICAL_SAFETY",
          title: "Stage 2: Heavy Equipment & Electrical Safety Inspection",
          description: "High voltage electrical installation inspection, transformer earthing audit, and machinery guard verification.",
          department: "Electrical Inspectorate & DISH",
          requiredDocuments: [
            "Single Line Electrical Wiring Diagram",
            "Transformer Earthing Resistance Test Report",
            "Machinery Fencing & Guarding Compliance Plan",
          ],
          estimatedProcessingTime: "5 - 7 Working Days",
        },
        {
          stepNumber: 3,
          stepCode: "SAFETY_INSPECTION",
          title: "Stage 3: Worker Health, Welfare & First-Aid Facility Inspection",
          description: "On-site audit of employee welfare facilities (canteen, crèche, first-aid room, PPE compliance).",
          department: "Inspectorate of Factories",
          requiredDocuments: [
            "Designated Certified Safety Officer Appointment",
            "Occupational Health Centre / First Aid Doctor Tie-up",
            "Emergency Disaster Management Plan",
          ],
          estimatedProcessingTime: "3 - 5 Working Days",
        },
        {
          stepNumber: 4,
          stepCode: "FACTORY_GRANT",
          title: "Stage 4: Grant of Factory License & Registration Certificate",
          description: "Issuance of statutory Factory Registration Certificate under Form 2 authorizing plant operations.",
          department: "Chief Inspector of Factories",
          requiredDocuments: [
            "Completed Form 2 Application",
            "Treasury Fee Payment Challan",
            "Building Occupancy Certificate Copy",
          ],
          estimatedProcessingTime: "3 - 5 Working Days",
        },
      ],
    },
  ]);

  console.log("📋 Creating sample clearance applications...");

  const app1 = await Application.create({
    applicationNumber: "ANM-BOILER-2026-0001",
    applicantId: entrepreneur._id,
    applicantName: entrepreneur.name,
    companyName: entrepreneur.companyName,
    sector: "Boiler",
    title: "High Pressure Steam Boiler Operational License",
    description: "Installation and pressure testing of 50-ton capacity water tube boiler with automatic safety relief valves.",
    estimatedBudget: 15000000,
    plantLocation: "Plot 45, GIDC Industrial Estate, Vadodara",
    status: "PENDING",
  });

  const app2 = await Application.create({
    applicationNumber: "ANM-POLLUTION-2026-0002",
    applicantId: entrepreneur._id,
    applicantName: entrepreneur.name,
    companyName: entrepreneur.companyName,
    sector: "Pollution",
    title: "Consent to Establish (CTE) Air & Water NOC",
    description: "Zero liquid discharge effluent treatment plant setup and wet scrubber installation for stack emissions.",
    estimatedBudget: 8500000,
    plantLocation: "Plot 45, GIDC Industrial Estate, Vadodara",
    status: "UNDER_REVIEW",
    assignedOfficerId: pollutionOfficer._id,
    remarks: "Site inspection scheduled for next week.",
  });

  const app3 = await Application.create({
    applicationNumber: "ANM-FACTORYLICENSE-2026-0003",
    applicantId: entrepreneur._id,
    applicantName: entrepreneur.name,
    companyName: entrepreneur.companyName,
    sector: "FactoryLicense",
    title: "Factory Building Safety & Heavy Machinery Approval",
    description: "Registration of manufacturing unit employing 120 workers under Factory Act section 2m(i).",
    estimatedBudget: 25000000,
    plantLocation: "Plot 45, GIDC Industrial Estate, Vadodara",
    status: "APPROVED",
    assignedOfficerId: factoryOfficer._id,
    remarks: "Structural safety certificate verified and approved.",
  });

  console.log("📜 Generating initial Audit Trail...");
  await AuditLog.create([
    {
      action: "USER_SIGNUP",
      performedBy: entrepreneur._id,
      userEmail: entrepreneur.email,
      role: entrepreneur.role,
      sector: entrepreneur.sector,
      details: { message: "Seed entrepreneur registered" },
      ipAddress: "127.0.0.1",
    },
    {
      action: "PROFILE_UPDATED",
      performedBy: entrepreneur._id,
      userEmail: entrepreneur.email,
      role: entrepreneur.role,
      sector: entrepreneur.sector,
      details: { gstin: "27AAACR1234K1ZI" },
      ipAddress: "127.0.0.1",
    },
    {
      action: "APPLICATION_SUBMITTED",
      performedBy: entrepreneur._id,
      userEmail: entrepreneur.email,
      role: entrepreneur.role,
      sector: app1.sector,
      targetId: app1._id.toString(),
      details: { applicationNumber: app1.applicationNumber },
      ipAddress: "127.0.0.1",
    },
  ]);

  console.log("✅ Seed database population complete!");
  console.log("---------------------------------------------------------");
  console.log("DEMO ACCOUNTS READY (Password: Password123!):");
  console.log("1. Entrepreneur:       entrepreneur@company.com (GSTIN: 27AAACR1234K1ZI)");
  console.log("2. Boiler Officer:     officer.boiler@gov.in");
  console.log("3. Pollution Officer:  officer.pollution@gov.in");
  console.log("4. Factory Officer:    officer.factory@gov.in");
  console.log("---------------------------------------------------------");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
