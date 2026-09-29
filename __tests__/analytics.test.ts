import * as auth from "@/lib/auth";

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

jest.mock("@/lib/auth", () => ({
  getCurrentUserSession: jest.fn(),
}));

jest.mock("@/lib/db", () => jest.fn());
jest.mock("@/models/AuditLog", () => ({
  aggregate: jest.fn(),
}));

import AuditLog from "@/models/AuditLog";
const { GET } = require("@/app/api/analytics/rejections/route");

describe("Server-Side Rejection Analytics API & TTL Cache", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("blocks non-officer entrepreneur sessions with HTTP 403 Forbidden", async () => {
    (auth.getCurrentUserSession as jest.Mock).mockResolvedValue({
      userId: "user_ent_1",
      email: "entrepreneur@company.com",
      role: "entrepreneur",
      sector: "Boiler",
    });

    const req = {
      nextUrl: new URL("http://localhost:3000/api/analytics/rejections"),
    } as any;
    const response = await GET(req);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Access restricted to statutory government officers");
  });

  it("permits officer session, executes aggregation pipeline, and returns breakdown with percentages", async () => {
    (auth.getCurrentUserSession as jest.Mock).mockResolvedValue({
      userId: "off_1",
      email: "officer.boiler@gov.in",
      role: "officer",
      sector: "Boiler",
    });

    const mockAggregationOutput = [
      {
        sector: "Boiler",
        totalSectorRejections: 10,
        breakdown: [
          {
            reason: "Incomplete Site Layout Specification",
            count: 6,
            percentage: 60,
          },
          {
            reason: "GSTIN Checksum Invalid",
            count: 4,
            percentage: 40,
          },
        ],
      },
    ];

    (AuditLog.aggregate as jest.Mock).mockResolvedValue(mockAggregationOutput);

    const req = {
      nextUrl: new URL("http://localhost:3000/api/analytics/rejections?refresh=true"),
    } as any;
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(3); // Boiler, Pollution, FactoryLicense

    const boilerSector = data.data.find((s: any) => s.sector === "Boiler");
    expect(boilerSector).toBeDefined();
    expect(boilerSector.totalSectorRejections).toBe(10);
    expect(boilerSector.breakdown[0].reason).toBe("Incomplete Site Layout Specification");
    expect(boilerSector.breakdown[0].percentage).toBe(60);

    expect(response.headers.get("X-Cache")).toBe("MISS");
  });

  it("serves subsequent requests within 5-minute TTL from memory cache (X-Cache: HIT)", async () => {
    (auth.getCurrentUserSession as jest.Mock).mockResolvedValue({
      userId: "off_1",
      email: "officer.boiler@gov.in",
      role: "officer",
      sector: "Boiler",
    });

    const mockAggregationOutput = [
      {
        sector: "Pollution",
        totalSectorRejections: 5,
        breakdown: [
          {
            reason: "Environmental Effluent Discharge Non-Compliant",
            count: 5,
            percentage: 100,
          },
        ],
      },
    ];

    (AuditLog.aggregate as jest.Mock).mockResolvedValue(mockAggregationOutput);

    // Initial call to populate cache
    const req1 = {
      nextUrl: new URL("http://localhost:3000/api/analytics/rejections?refresh=true"),
    } as any;
    const res1 = await GET(req1);
    expect(res1.headers.get("X-Cache")).toBe("MISS");

    // Second call should hit cache
    const req2 = {
      nextUrl: new URL("http://localhost:3000/api/analytics/rejections"),
    } as any;
    const res2 = await GET(req2);
    expect(res2.headers.get("X-Cache")).toBe("HIT");

    const data2 = await res2.json();
    expect(data2.cached).toBe(true);
    expect(data2.cacheExpiresInSeconds).toBeGreaterThan(0);
  });
});
