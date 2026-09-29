import * as auth from "@/lib/auth";
import { tokenizeText, scoreChunk, retrieveRelevantChunks } from "@/lib/rag/retrievalEngine";
import { generateRagAnswer, GROQ_MODEL_NAME } from "@/lib/rag/groqRagService";
import { rateLimit } from "@/lib/rate-limit";

jest.mock("@/lib/auth", () => ({
  getCurrentUserSession: jest.fn(),
}));

jest.mock("@/lib/db", () => jest.fn());

jest.mock("@/models/SectorKnowledge", () => ({
  countDocuments: jest.fn().mockResolvedValue(9),
  insertMany: jest.fn().mockResolvedValue([]),
  find: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue([
      {
        sector: "Boiler",
        chunkId: "BLR-RAG-001",
        title: "Boiler Registration & Hydrostatic Pressure Test Requirements",
        category: "Registration & Testing",
        sourceRule: "Indian Boilers Act 1923, Section 6 & 7",
        keywords: ["registration", "hydrostatic test", "pressure test", "inspection"],
        content: "Inspector of Boilers must perform Hydrostatic Test at 1.5 times MAWP.",
      },
    ]),
  }),
}));

jest.mock("@/models/ChatHistory", () => ({
  findOneAndUpdate: jest.fn().mockResolvedValue({}),
  findOne: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue({
      sector: "Boiler",
      messages: [],
    }),
  }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
}));

jest.mock("@/lib/rag/seedKnowledge", () => ({
  seedSectorKnowledge: jest.fn().mockResolvedValue(undefined),
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

describe("Sector-Scoped Statutory Groq RAG Chatbot Suite", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Retrieval Engine & Tokenization Unit Tests", () => {
    it("tokenizes query text removing common stopwords and punctuation", () => {
      const tokens = tokenizeText("What are the hydrostatic pressure test requirements for boiler registration?");
      expect(tokens).toContain("hydrostatic");
      expect(tokens).toContain("pressure");
      expect(tokens).toContain("test");
      expect(tokens).toContain("boiler");
      expect(tokens).toContain("registration");
      expect(tokens).not.toContain("what");
      expect(tokens).not.toContain("the");
      expect(tokens).not.toContain("for");
    });

    it("scores matching sector chunk higher than non-matching chunk", () => {
      const mockChunk: any = {
        sector: "Boiler",
        chunkId: "BLR-001",
        title: "Boiler Registration & Hydrostatic Pressure Test Requirements",
        category: "Testing",
        sourceRule: "Indian Boilers Act 1923, Section 6",
        keywords: ["hydrostatic", "pressure test"],
        content: "Inspector must perform Hydrostatic Test at 1.5 times working pressure.",
      };

      const queryTokens = ["hydrostatic", "pressure", "test"];
      const score = scoreChunk(mockChunk, queryTokens, "hydrostatic pressure test");

      expect(score).toBeGreaterThan(15);
    });

    it("retrieves relevant sector chunks matching query keywords", async () => {
      const chunks = await retrieveRelevantChunks("Boiler", "hydrostatic pressure test", 3);
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].chunkId).toBe("BLR-RAG-001");
      expect(chunks[0].sourceRule).toBe("Indian Boilers Act 1923, Section 6 & 7");
    });
  });

  describe("Groq RAG Service & Fallback Logic", () => {
    it("utilizes Groq llama-3.3-70b-versatile model name constant", () => {
      expect(GROQ_MODEL_NAME).toBe("llama-3.3-70b-versatile");
    });

    it("generates statutory response with structured citations via fallback engine when GROQ_API_KEY is blank", async () => {
      const mockChunks = [
        {
          chunkId: "BLR-RAG-001",
          title: "Boiler Hydrostatic Test Specs",
          category: "Testing",
          sourceRule: "Indian Boilers Act 1923, Section 6 & 7",
          content: "Hydrostatic Test pressure must be sustained at 1.5x MAWP for 30 minutes.",
          score: 25,
        },
      ];

      const result = await generateRagAnswer("What is the hydrostatic test pressure?", "Boiler", mockChunks);

      expect(result.answer).toContain("Boiler");
      expect(result.answer).toContain("Indian Boilers Act 1923, Section 6 & 7");
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].chunkId).toBe("BLR-RAG-001");
      expect(result.citations[0].sourceRule).toBe("Indian Boilers Act 1923, Section 6 & 7");
      expect(result.usedFallback).toBe(true);
      expect(result.modelUsed).toBe("internal-statutory-compliance-engine");
    });

    it("returns explicit unhandled query statement when matched chunks have zero relevance score", async () => {
      const mockChunks = [
        {
          chunkId: "BLR-RAG-001",
          title: "Boiler Mountings",
          category: "Mountings",
          sourceRule: "Indian Boiler Regulations 1950",
          content: "Safety valve calibration rules.",
          score: 0,
        },
      ];

      const result = await generateRagAnswer("Unrelated question about taxation", "Boiler", mockChunks);

      expect(result.answer).toContain("The provided statutory guidelines for the Boiler sector do not contain information");
      expect(result.citations).toHaveLength(0);
    });
  });

  describe("Rate Limiter Unit Test", () => {
    it("enforces sliding window rate limit threshold per user identifier", () => {
      const testKey = `test_user_rate_limit_${Date.now()}`;
      
      // Perform 5 hits out of max 5
      for (let i = 0; i < 5; i++) {
        const res = rateLimit(testKey, 5, 60000);
        expect(res.success).toBe(true);
      }

      // 6th hit should fail
      const blockedRes = rateLimit(testKey, 5, 60000);
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.reset).toBeGreaterThan(0);
    });
  });
});
