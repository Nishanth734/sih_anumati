# ANUMATI — Government Industrial-Approvals Platform

**ANUMATI** is a production-grade, single-window industrial clearances and licensing platform built with **Next.js 14+ (App Router, TypeScript)** and **MongoDB Atlas (via Mongoose)**.

The platform streamlines government regulatory approvals across key industrial sectors, providing role-based security, automated workflow routing, field-level compliance validation, rate limiting, an Entrepreneur Profile System with 1-click auto-fill, statutory RAG AI chatbot, vector search using Pinecone, and immutable audit logs.

---

## 🏗️ Architecture & Directory Structure

```text
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts      # Rate-limited Zod signup API
│   │   │   ├── login/route.ts       # Rate-limited bcrypt login API
│   │   │   ├── logout/route.ts      # Cookie clearing API
│   │   │   └── me/route.ts          # Authenticated session user endpoint
│   │   ├── profile/
│   │   │   └── route.ts             # GET & PUT Profile API with Zod validation
│   │   ├── chat/
│   │   │   └── route.ts             # Groq RAG statutory chatbot API route
│   │   ├── schemes/
│   │   │   └── route.ts             # Recommended incentive schemes API
│   │   └── applications/
│   │       ├── route.ts             # List & Create industrial clearance filings
│   │       └── [id]/status/route.ts # Officer status review & audit commit
│   ├── dashboard/
│   │   ├── entrepreneur/page.tsx    # Entrepreneur filing portal with profile autofill & schemes
│   │   └── officer/page.tsx         # Sector Officer approval queue & rejection analytics
│   ├── chat/page.tsx                # Statutory RAG Chatbot UI with citation modal & retry
│   ├── profile/page.tsx             # Entrepreneur profile management route
│   ├── roadmap/page.tsx             # Interactive sector stepper checklist
│   ├── layout.tsx                   # Root layout with Gov navbar, footer, error boundary
│   └── page.tsx                     # Landing page showcasing portal features
├── components/
│   ├── ErrorBoundary.tsx            # React Class Error Boundary for UI resilience
│   ├── RecommendedSchemes.tsx       # Government subsidy schemes card panel
│   ├── RejectionAnalyticsPanel.tsx  # Officer aggregate rejection analytics chart
│   ├── RoadmapStepper.tsx           # Accessible stepper component
│   └── Navbar.tsx                   # Official header with sector badge & RAG chat link
├── lib/
│   ├── db.ts                        # Mongoose connection with HMR caching
│   ├── auth.ts                      # Bcrypt password hashing (cost 12) & Jose JWT cookies
│   ├── api-error.ts                 # Centralized API error handler
│   ├── rate-limit.ts                # In-memory sliding window rate limiter
│   ├── rag/
│   │   ├── embeddingService.ts      # @xenova/transformers 384-d dense vector generator
│   │   ├── groqRagService.ts        # Groq LLM (llama-3.3-70b-versatile) RAG completion
│   │   ├── retrievalEngine.ts       # Pinecone vector similarity search + keyword fallback
│   │   └── seedKnowledge.ts         # Hand-authored statutory regulation chunks
│   └── seedSchemes.ts               # Official government subsidy schemes seed data
├── models/
│   ├── User.ts                      # User schema (indexed email, role/sector enums, PAN)
│   ├── EntrepreneurProfile.ts       # Dedicated profile schema (PAN, GSTIN, phone, address)
│   ├── Application.ts               # Industrial Clearance schema
│   ├── SectorKnowledge.ts           # RAG Knowledge Chunks schema
│   ├── ChatHistory.ts               # User chat message history schema
│   └── Scheme.ts                    # Statutory incentive schemes schema
├── scripts/
│   ├── seed.ts                      # Dev seed script with sample users & profile data
│   └── upsertKnowledgeToPinecone.ts # Embeds & upserts knowledge chunks to Pinecone vector index
├── __tests__/
│   ├── chatRag.test.ts              # RAG retrieval, Groq API & Pinecone tests
│   ├── schemes.test.ts              # Recommended schemes API tests
│   ├── analytics.test.ts            # Officer rejection analytics tests
│   └── validators.test.ts           # Compliance validator tests
├── middleware.ts                    # Edge JWT verification, CORS & security headers
├── .env.example                     # Documented environment variables template
└── .env.local                       # Local development environment configuration
```

---

## 🌲 Pinecone Vector Search Setup (RAG Chatbot)

To enable real vector similarity search for the statutory RAG chatbot:

1. **Create a Free Pinecone Index**:
   - Log in to [Pinecone Console](https://app.pinecone.io).
   - Create a new Index with the following configuration:
     - **Index Name**: `anumati-statutory-rag`
     - **Dimensions**: `384` (matching `@xenova/transformers` sentence-transformers embedding model `Xenova/all-MiniLM-L6-v2`)
     - **Metric**: `Cosine`
2. **Configure Environment Variables**:
   Add your Pinecone API key to `.env.local`:
   ```env
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_INDEX_NAME=anumati-statutory-rag
   ```
3. **Upsert Statutory Knowledge Vectors**:
   Run the vector embedding and upsert script to populate Pinecone with sector-scoped statutory vectors:
   ```bash
   npm run seed:vectors
   ```
   *Note: If `PINECONE_API_KEY` is not configured or unreachable, the chatbot automatically falls back to keyword-based retrieval without breaking.*

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` before running:

```bash
cp .env.example .env.local
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed the Database
Populate local MongoDB with realistic demo users, industrial profile, officers, and clearance applications:
```bash
npm run seed
```

#### Demo Credentials:
| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Entrepreneur** | `entrepreneur@company.com` | `Password123!` | Apex Steel Works (GSTIN: `27AAACR1234K1ZI`) |
| **Boiler Officer** | `officer.boiler@gov.in` | `Password123!` | Officer ID: `GOV-OFF-101` (Sector: `Boiler`) |
| **Pollution Officer** | `officer.pollution@gov.in` | `Password123!` | Officer ID: `GOV-OFF-102` (Sector: `Pollution`) |
| **Factory Officer** | `officer.factory@gov.in` | `Password123!` | Officer ID: `GOV-OFF-103` (Sector: `FactoryLicense`) |

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Unit Tests

Run all unit tests across the 10 test suites:
```bash
npm test
```

---

## 🛡️ License & Compliance
Official Government Clearance Gateway Software Specification.
