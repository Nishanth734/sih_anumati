import connectToDatabase from "@/lib/db";
import Scheme from "@/models/Scheme";

export const DEFAULT_SCHEMES = [
  // ==================== BOILER SECTOR SCHEMES ====================
  {
    sector: "Boiler",
    schemeId: "SCHEME-BLR-001",
    name: "BEE Boiler Modernization & Energy Efficiency Scheme",
    ministry: "Bureau of Energy Efficiency (BEE), Ministry of Power",
    eligibilitySummary:
      "Registered MSME industrial units replacing inefficient conventional boilers (thermal efficiency <70%) with BEE 5-Star rated boilers, PNG, or Biomass-fired high-efficiency steam generators.",
    benefits:
      "50% capital subsidy on new boiler equipment cost up to ₹15,00,000 per manufacturing unit, plus a 3% interest subvention on bank term loans for 5 years.",
    benefitAmount: "Up to ₹15 Lakhs Capital Subsidy + 3% Interest Subvention",
    applicationDescription:
      "Submit a certified Boiler Energy Audit Report along with equipment quotations to the official BEE MSME portal. Upon technical committee approval, proceed with installation and claim reimbursement.",
    officialLink: "https://beeindia.gov.in/en/programmes/msme",
    isActive: true,
  },
  {
    sector: "Boiler",
    schemeId: "SCHEME-BLR-002",
    name: "National Boiler Safety Inspection & Testing Assistance Grant",
    ministry: "Central Boiler Board, Ministry of Commerce & Industry",
    eligibilitySummary:
      "Industrial units operating boilers over 10 years old undergoing mandatory annual inspector safety audits, hydrostatic testing, and ultrasonic thickness gauging.",
    benefits:
      "100% waiver of statutory inspection fees for first-time MSME applicants, along with a ₹50,000 financial grant towards Non-Destructive Testing (NDT) and safety valve calibration.",
    benefitAmount: "100% Statutory Inspection Fee Waiver + ₹50,000 NDT Grant",
    applicationDescription:
      "File Form I application on the State Boiler Directorate portal with previous year inspection logs and NDT testing lab booking receipt. Subsidy is automatically credited to the registered bank account.",
    officialLink: "https://dpiit.gov.in/boiler-regulations",
    isActive: true,
  },

  // ==================== POLLUTION SECTOR SCHEMES ====================
  {
    sector: "Pollution",
    schemeId: "SCHEME-POL-001",
    name: "Common Effluent Treatment Plant (CETP) Capital Assistance Scheme",
    ministry: "Ministry of Environment, Forest & Climate Change (MoEFCC)",
    eligibilitySummary:
      "Industrial clusters, textile parks, and chemical processing zones establishing collective Effluent Treatment Plants (ETP) or upgrading to Zero Liquid Discharge (ZLD) standards.",
    benefits:
      "50% Central financial assistance (up to ₹20 Crores per project) combined with a 25% State matching capital grant for setting up RO, MEE, and biological treatment systems.",
    benefitAmount: "50% Central Capital Grant (Max ₹20 Crores)",
    applicationDescription:
      "Cluster SPV consortium submits a Detailed Project Report (DPR) endorsed by the State Pollution Control Board (SPCB) to the MoEFCC portal for appraisal by the National Screening Committee.",
    officialLink: "https://moef.gov.in/en/division/environment-divisions/pollution-control",
    isActive: true,
  },
  {
    sector: "Pollution",
    schemeId: "SCHEME-POL-002",
    name: "CPCB Clean Technology & CEMS Equipment Financial Incentive",
    ministry: "Central Pollution Control Board (CPCB)",
    eligibilitySummary:
      "Red and Orange category manufacturing units installing online Continuous Emission Monitoring Systems (CEMS) and wet flue gas scrubbing hardware.",
    benefits:
      "30% capital grant on CEMS sensor hardware and telemetry infrastructure up to ₹25,00,000, along with free cloud server API integration support.",
    benefitAmount: "30% Hardware Grant (Up to ₹25 Lakhs)",
    applicationDescription:
      "Register CEMS device hardware UUID on the CPCB OCEMS portal and upload the vendor tax invoice and NABL calibration certificate for direct grant transfer.",
    officialLink: "https://cpcb.nic.in/ocems/",
    isActive: true,
  },

  // ==================== FACTORY LICENSE SECTOR SCHEMES ====================
  {
    sector: "FactoryLicense",
    schemeId: "SCHEME-FAC-001",
    name: "MSME Zero Defect Zero Effect (ZED) Safety & Quality Scheme",
    ministry: "Ministry of Micro, Small & Medium Enterprises (MoMSME)",
    eligibilitySummary:
      "Manufacturing units holding a valid Factory License applying for ZED Certification and industrial workplace safety compliance audits.",
    benefits:
      "80% subsidy on ZED certification fees, plus up to ₹5,00,000 financial assistance for factory fire safety automation, structural stability retrofits, and worker safety gear.",
    benefitAmount: "80% Certification Subsidy + ₹5 Lakhs Safety Upgrade Grant",
    applicationDescription:
      "Register on the official MSME ZED portal with your Udyam Registration Number and Factory License copy. Complete the online safety self-assessment followed by an accredited site audit.",
    officialLink: "https://zed.msme.gov.in",
    isActive: true,
  },
];

export async function seedSchemes() {
  await connectToDatabase();
  const count = await Scheme.countDocuments();
  if (count === 0) {
    console.log("[Schemes Seed] Seeding official government incentive schemes...");
    await Scheme.insertMany(DEFAULT_SCHEMES);
    console.log("[Schemes Seed] Successfully inserted 5 official scheme entries.");
  }
}
