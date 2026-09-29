import * as auth from "@/lib/auth";

jest.mock("@/lib/auth", () => ({
  getCurrentUserSession: jest.fn(),
}));

jest.mock("@/lib/db", () => jest.fn());

const mockSchemesDb: Record<string, any[]> = {
  Boiler: [
    {
      _id: "scheme_1",
      sector: "Boiler",
      schemeId: "SCHEME-BLR-001",
      name: "BEE Boiler Modernization & Energy Efficiency Scheme",
      ministry: "Bureau of Energy Efficiency (BEE), Ministry of Power",
      eligibilitySummary: "MSME industrial units replacing inefficient conventional boilers with 5-Star rated boilers.",
      benefits: "50% capital subsidy on new boiler equipment cost up to ₹15,00,000.",
      benefitAmount: "Up to ₹15 Lakhs Subsidy",
      applicationDescription: "Submit Boiler Energy Audit Report to BEE portal.",
      officialLink: "https://beeindia.gov.in/en/programmes/msme",
      isActive: true,
    },
  ],
  Pollution: [
    {
      _id: "scheme_2",
      sector: "Pollution",
      schemeId: "SCHEME-POL-001",
      name: "Common Effluent Treatment Plant (CETP) Capital Assistance Scheme",
      ministry: "Ministry of Environment, Forest & Climate Change (MoEFCC)",
      eligibilitySummary: "Industrial clusters establishing collective ETP or ZLD plants.",
      benefits: "50% Central financial assistance up to ₹20 Crores.",
      benefitAmount: "50% Capital Assistance (Max ₹20 Cr)",
      applicationDescription: "Submit DPR to MoEFCC portal.",
      officialLink: "https://moef.gov.in",
      isActive: true,
    },
  ],
  FactoryLicense: [], // Empty state test sector
};

jest.mock("@/models/Scheme", () => ({
  countDocuments: jest.fn().mockResolvedValue(2),
  insertMany: jest.fn().mockResolvedValue([]),
  find: jest.fn().mockImplementation((query: { sector: string; isActive?: boolean }) => ({
    lean: jest.fn().mockResolvedValue(mockSchemesDb[query.sector] || []),
  })),
}));

jest.mock("@/lib/seedSchemes", () => ({
  seedSchemes: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/server", () => {
  class MockHeaders {
    private map = new Map<string, string>();
    constructor(init?: Record<string, string>) {
      if (init) {
        Object.entries(init).forEach(([k, v]) => this.map.set(k.toLowerCase(), v));
      }
    }
    get(name: string) {
      return this.map.get(name.toLowerCase()) || null;
    }
    set(name: string, value: string) {
      this.map.set(name.toLowerCase(), value);
    }
    getSetCookie() {
      return [];
    }
  }

  class MockNextResponse {
    status: number;
    headers: MockHeaders;
    private _data: any;

    constructor(body: any, init?: any) {
      this.status = init?.status || 200;
      this.headers = new MockHeaders(init?.headers);
      this._data = body;
    }

    static json(body: any, init?: any) {
      return new MockNextResponse(body, init);
    }

    async json() {
      return typeof this._data === "string" ? JSON.parse(this._data) : this._data;
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: jest.fn(),
  };
});

const { GET } = require("@/app/api/schemes/route");

describe("Recommended Statutory Schemes API & Sector Scoping Suite", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("blocks unauthenticated requests with HTTP 401 Unauthorized", async () => {
    (auth.getCurrentUserSession as jest.Mock).mockResolvedValue(null);

    const req = {
      url: "http://localhost:3000/api/schemes",
    } as any;

    const response = await GET(req);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Authentication required");
  });

  it("returns schemes matching entrepreneur's declared sector (Boiler)", async () => {
    (auth.getCurrentUserSession as jest.Mock).mockResolvedValue({
      userId: "ent_123",
      email: "entrepreneur@company.com",
      role: "entrepreneur",
      sector: "Boiler",
    });

    const req = {
      url: "http://localhost:3000/api/schemes",
    } as any;

    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.sector).toBe("Boiler");
    expect(data.data.schemes).toHaveLength(1);
    expect(data.data.schemes[0].name).toContain("BEE Boiler Modernization");
    expect(data.data.schemes[0].officialLink).toBe("https://beeindia.gov.in/en/programmes/msme");
  });

  it("allows explicitly specifying sector filter via query parameters (?sector=Pollution)", async () => {
    (auth.getCurrentUserSession as jest.Mock).mockResolvedValue({
      userId: "ent_123",
      email: "entrepreneur@company.com",
      role: "entrepreneur",
      sector: "Boiler",
    });

    const req = {
      url: "http://localhost:3000/api/schemes?sector=Pollution",
    } as any;

    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.sector).toBe("Pollution");
    expect(data.data.schemes).toHaveLength(1);
    expect(data.data.schemes[0].name).toContain("Common Effluent Treatment Plant");
  });

  it("returns clean empty state array for sectors with no active schemes", async () => {
    (auth.getCurrentUserSession as jest.Mock).mockResolvedValue({
      userId: "ent_123",
      email: "entrepreneur@company.com",
      role: "entrepreneur",
      sector: "FactoryLicense",
    });

    const req = {
      url: "http://localhost:3000/api/schemes?sector=FactoryLicense",
    } as any;

    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.sector).toBe("FactoryLicense");
    expect(data.data.schemes).toHaveLength(0);
    expect(data.data.count).toBe(0);
  });
});
