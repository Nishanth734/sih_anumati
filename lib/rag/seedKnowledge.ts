import connectToDatabase from "@/lib/db";
import SectorKnowledge, { ISectorKnowledge } from "@/models/SectorKnowledge";

export const DEFAULT_KNOWLEDGE_CHUNKS = [
  // ==================== BOILER SECTOR ====================
  {
    sector: "Boiler",
    documentType: "PAN_CARD",
    chunkId: "BLR-PAN-001",
    title: "Business Permanent Account Number (PAN) Statutory Tax Compliance",
    category: "Tax Registration",
    sourceRule: "Income Tax Act 1961, Section 139A & Rule 114",
    keywords: ["pan", "pan card", "tax registration", "section 139a", "income tax", "entity match"],
    content:
      "Under Section 139A of the Income Tax Act 1961, every industrial boiler enterprise applying for statutory registration must possess a valid 10-character Permanent Account Number (PAN). The entity name on the PAN card must match the applicant firm name, and tax registration must remain active.",
  },
  {
    sector: "Boiler",
    documentType: "GSTIN_CERTIFICATE",
    chunkId: "BLR-GST-001",
    title: "GSTIN Registration & Goods & Services Tax Compliance",
    category: "GST Compliance",
    sourceRule: "Central Goods and Services Tax Act 2017, Section 22 & 25",
    keywords: ["gstin", "gst certificate", "cgst act", "tax compliance", "modulus 36"],
    content:
      "Under Section 22 & 25 of the CGST Act 2017, industrial boiler units must hold an active 15-digit GSTIN certificate. The GSTIN must contain a valid Modulus 36 checksum and state code matching the registered manufacturing plant premises.",
  },
  {
    sector: "Boiler",
    documentType: "SITE_PLAN",
    chunkId: "BLR-RAG-001",
    title: "Boiler Registration & Hydrostatic Pressure Test Requirements",
    category: "Registration & Testing",
    sourceRule: "Indian Boilers Act 1923, Section 6 & 7",
    keywords: ["registration", "hydrostatic test", "pressure test", "inspection", "boiler certificate", "act 1923"],
    content:
      "Under Section 6 & 7 of the Indian Boilers Act 1923, no boiler shall be used before being registered and issued a valid Certificate of Inspection. The registration process requires submitting Form I (Maker's Certificate), Form II (Inspection Certificate during construction), and Form III (Steam Pipe Test Certificate). Prior to commissioning, the Inspector of Boilers must perform a Hydrostatic Test at 1.5 times the maximum allowable working pressure (MAWP). The test pressure must be sustained for at least 30 minutes without leakage or permanent deformation.",
  },
  {
    sector: "Boiler",
    documentType: "SAFETY_NOC",
    chunkId: "BLR-RAG-002",
    title: "Boiler Mountings, Safety Valve Calibration & Gauge Specs",
    category: "Safety Compliance",
    sourceRule: "Indian Boiler Regulations 1950, Regulation 281-295",
    keywords: ["safety valve", "mountings", "calibration", "steam pressure", "water gauge", "regulation 281"],
    content:
      "Every steam boiler must be fitted with at least two spring-loaded safety valves capable of discharging all steam generated without raising pressure more than 10% above working pressure (Reg 281). Safety valves must be calibrated annually by an authorized testing laboratory and sealed by the Boiler Inspector. In addition, two independent water level gauges with protective glass shields and a main steam stop valve must be installed on the boiler shell.",
  },
  {
    sector: "Boiler",
    documentType: "SAFETY_NOC",
    chunkId: "BLR-RAG-003",
    title: "Certified Boiler Attendant & Boiler Inspector Audit Rules",
    category: "Operational Manning",
    sourceRule: "Boiler Attendants Rules 2011, Rule 12 & 14",
    keywords: ["attendant", "boiler operator", "competency certificate", "first class attendant", "audit", "staffing"],
    content:
      "Boilers with a heating surface area exceeding 100 sq. meters must be under the direct supervision of a First Class Boiler Attendant holding a valid Competency Certificate issued by the State Boiler Board. For boilers under 100 sq. meters, a Second Class Attendant is mandatory. Unattended operation is strictly prohibited. Annual fitness audits must be completed 30 days prior to certificate expiry, accompanied by chimney smoke density logs.",
  },

  // ==================== POLLUTION SECTOR ====================
  {
    sector: "Pollution",
    documentType: "PAN_CARD",
    chunkId: "POL-PAN-001",
    title: "Pollution Clearance Business PAN Statutory Verification",
    category: "Tax Registration",
    sourceRule: "Income Tax Act 1961, Section 139A",
    keywords: ["pan", "pan card", "tax registration", "income tax", "pollution consent"],
    content:
      "Under Section 139A of the Income Tax Act 1961, industrial units seeking Consent to Establish (CTE) or Operate (CTO) must submit a valid 10-character Permanent Account Number (PAN) registered to the industrial entity.",
  },
  {
    sector: "Pollution",
    documentType: "GSTIN_CERTIFICATE",
    chunkId: "POL-GST-001",
    title: "GSTIN Registration for Pollution Control Compliance",
    category: "GST Compliance",
    sourceRule: "Central Goods and Services Tax Act 2017, Section 22",
    keywords: ["gstin", "gst certificate", "tax compliance", "spcb"],
    content:
      "Industrial facilities must maintain active 15-digit GSTIN registration issued by CBIC. The GSTIN must pass Modulus 36 statutory checksum verification and match the plant location.",
  },
  {
    sector: "Pollution",
    documentType: "SITE_PLAN",
    chunkId: "POL-RAG-001",
    title: "Consent to Establish (CTE) & Chimney Stack Height Specifications",
    category: "Air Pollution Norms",
    sourceRule: "Air (Prevention and Control of Pollution) Act 1981, Section 21",
    keywords: ["consent to establish", "cte", "chimney height", "stack height", "air pollution", "boiler chimney"],
    content:
      "Under Section 21 of the Air Act 1981, industrial units must obtain Consent to Establish (CTE) before beginning site construction. For units utilizing solid fuel or industrial boilers, chimney stack height H must be calculated using the formula H = 14 * (Q)^0.3, where Q is the SO2 emission rate in kg/hr, subject to a minimum height of 30 meters above ground level. Continuous Emission Monitoring Systems (CEMS) must be interfaced directly with the Pollution Control Board cloud portal.",
  },
  {
    sector: "Pollution",
    documentType: "SAFETY_NOC",
    chunkId: "POL-RAG-002",
    title: "Effluent Treatment Plant (ETP) Standards & Zero Liquid Discharge (ZLD)",
    category: "Water Pollution Norms",
    sourceRule: "Water (Prevention and Control of Pollution) Act 1974, Section 25",
    keywords: ["etp", "effluent treatment", "zld", "zero liquid discharge", "bod", "cod", "ph limit", "water act"],
    content:
      "Section 25 of the Water Act 1974 mandates that industrial trade effluent must be treated in an Effluent Treatment Plant (ETP) prior to discharge. Discharged water parameters must strictly adhere to: pH between 6.5 - 8.5, BOD (3 days at 27°C) <= 30 mg/L, COD <= 250 mg/L, and Total Suspended Solids (TSS) <= 100 mg/L. Red category industries located in water-scarce zones must implement Zero Liquid Discharge (ZLD) systems with Reverse Osmosis (RO) and Multi-Effect Evaporators (MEE).",
  },
  {
    sector: "Pollution",
    documentType: "SAFETY_NOC",
    chunkId: "POL-RAG-003",
    title: "Hazardous Waste Manifest, Storage & Authorized Recycler Norms",
    category: "Waste Management",
    sourceRule: "Hazardous and Other Wastes (Management & Transboundary Movement) Rules 2016, Rule 6",
    keywords: ["hazardous waste", "manifest", "form 10", "waste storage", "recycler", "rule 6"],
    content:
      "Industrial units generating hazardous waste (such as boiler ash, ETP sludge, spent solvents) must maintain authorization under Rule 6. Hazardous waste must be stored in leak-proof containers inside a designated shed with concrete bunding for no more than 90 days. Transport of hazardous waste to TSDF (Treatment, Storage and Disposal Facility) or authorized recyclers requires executing a 7-copy Manifest (Form 10). Annual waste returns in Form 4 must be filed before June 30th every year.",
  },

  // ==================== FACTORY LICENSE SECTOR ====================
  {
    sector: "FactoryLicense",
    documentType: "PAN_CARD",
    chunkId: "FAC-PAN-001",
    title: "Factory License Business Tax PAN Card Verification",
    category: "Tax Registration",
    sourceRule: "Income Tax Act 1961, Section 139A",
    keywords: ["pan", "pan card", "tax registration", "factories act", "applicant pan"],
    content:
      "Under Section 139A of the Income Tax Act 1961, factory license applicants must present a valid 10-character Permanent Account Number (PAN) matching registered enterprise records.",
  },
  {
    sector: "FactoryLicense",
    documentType: "GSTIN_CERTIFICATE",
    chunkId: "FAC-GST-001",
    title: "GSTIN Registration for Factory License Clearance",
    category: "GST Compliance",
    sourceRule: "Central Goods and Services Tax Act 2017, Section 22",
    keywords: ["gstin", "gst certificate", "dish", "factory license"],
    content:
      "Factories operating commercial manufacturing lines must present a valid 15-digit GSTIN certificate passing Modulus 36 statutory checksum verification with active registration status.",
  },
  {
    sector: "FactoryLicense",
    documentType: "SITE_PLAN",
    chunkId: "FAC-RAG-001",
    title: "Factory Site Plan Approval & Fire Safety Distance Standards",
    category: "Site Approval & Safety",
    sourceRule: "Factories Act 1948, Section 6",
    keywords: ["factory plan", "fire safety", "building clearance", "distance norm", "section 6", "site approval"],
    content:
      "Section 6 of the Factories Act 1948 requires prior written approval from the Chief Inspector of Factories for site selection and factory floor plan drawings. Factory buildings must maintain a minimum clear margin of 6 meters from boundary walls for emergency fire tender movement. Highly flammable chemical storage tanks must be set back at least 15 meters from manufacturing blocks with automated sprinkler protection.",
  },
  {
    sector: "FactoryLicense",
    documentType: "SITE_PLAN",
    chunkId: "FAC-RAG-002",
    title: "Structural Stability Certificate & Maximum Occupancy Standards",
    category: "Building Safety",
    sourceRule: "Factories Rules 1950, Rule 3-A & 4",
    keywords: ["structural stability", "occupancy", "floor space", "chartered engineer", "cubic meter", "rule 3-a"],
    content:
      "A Structural Stability Certificate issued by a registered Chartered Structural Engineer must be submitted prior to factory commissioning and renewed every 5 years (Rule 3-A). Workrooms must provide at least 4.2 cubic meters of space per worker, excluding space occupied by machinery. Clear gangways of at least 1.2 meters width must be maintained between production line machinery.",
  },
  {
    sector: "FactoryLicense",
    documentType: "SAFETY_NOC",
    chunkId: "FAC-RAG-003",
    title: "Worker Welfare Facilities (Canteen, First-Aid, Restroom Ratios)",
    category: "Worker Welfare",
    sourceRule: "Factories Act 1948, Section 42-49",
    keywords: ["worker welfare", "canteen", "first aid", "restroom", "creche", "section 42"],
    content:
      "Sections 42 to 49 prescribe mandatory welfare amenities based on workforce size: (1) First-aid boxes staffed by trained personnel must be available at a ratio of 1 box per 150 workers; (2) An equipped ambulance room is mandatory for factories employing 500+ workers; (3) A hygienic canteen must be provided where 250+ workers are employed; (4) Crèche facilities must be maintained for children under 6 years in units with 30+ female employees.",
  },
];

export async function seedSectorKnowledge() {
  await connectToDatabase();

  const ModelObj: any = (SectorKnowledge as any).default || SectorKnowledge;
  if (!ModelObj || typeof ModelObj.findOne !== "function") return;

  const sampleDoc = await ModelObj.findOne({ documentType: { $exists: true } });
  const totalCount = await ModelObj.countDocuments();

  if (totalCount === 0 || !sampleDoc) {
    console.log("[RAG Seed] Refreshing SectorKnowledge collection with updated statutory chunks and documentType metadata...");
    await ModelObj.deleteMany({});
    await ModelObj.insertMany(DEFAULT_KNOWLEDGE_CHUNKS);
    console.log(`[RAG Seed] Successfully inserted ${DEFAULT_KNOWLEDGE_CHUNKS.length} knowledge chunks across sectors & document types.`);
  }
}
