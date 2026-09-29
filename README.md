# 🏛️ ANUMATI — AI-Powered Single-Window Industrial Clearance Platform

<div align="center">

![ANUMATI Banner](https://img.shields.io/badge/Smart%20India%20Hackathon-2024-orange?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=for-the-badge&logo=tailwind-css)

**Simplifying industrial statutory clearances through AI, OCR, and topological compliance roadmaps.**

[Live Demo](#) · [Problem Statement](#problem-statement) · [Features](#features) · [Architecture](#architecture) · [Setup](#getting-started)

</div>

---

## 📌 Problem Statement

**Smart India Hackathon 2024**

Industrial entrepreneurs in India face a fragmented, paper-heavy process to obtain statutory clearances — Boiler licenses, Factory licenses, Pollution Control certificates — across multiple departments with no unified visibility. Delays cost crores in idle capital and discourage MSME growth.

**ANUMATI** (अनुमति — meaning *Permission* in Hindi) is a single-window AI platform that:
- Maps out every mandatory clearance a factory must obtain
- Verifies uploaded documents using OCR + AI in real time
- Gives government officers a streamlined review console
- Provides entrepreneurs a live compliance roadmap with dependency ordering

---

## ✨ Features

### 🏭 For Entrepreneurs
| Feature | Description |
|---|---|
| **Statutory Roadmap** | Visual topological DAG of all required clearances, sorted by dependency order |
| **AI Compliance Chat** | Ask questions about any clearance — powered by Groq LLM + Pinecone RAG |
| **Smart Document Verification** | Upload PDFs → OCR extraction → 2-layer AI verification (hard rules + semantic) |
| **Application Tracker** | Real-time status from `PENDING` → `UNDER_REVIEW` → `APPROVED` |
| **CAD Pre-Scrutiny** | AI-powered drawing analysis before official submission |
| **DigiLocker Integration** | Simulated DigiLocker-style document fetch from profile |
| **SLA Alerts** | Automatic notification if officer review exceeds statutory deadline |

### 🏛️ For Clearance Officers
| Feature | Description |
|---|---|
| **Review Console** | Queue of applications filtered by officer's sector (Boiler / Pollution / Factory) |
| **Document Viewer** | Side-by-side document review with AI pre-analysis summary |
| **Approve / Reject** | One-click decisions with mandatory rejection reasons |
| **Digital Certificate** | Auto-generated downloadable clearance certificate on approval |
| **Analytics Panel** | Rejection reason breakdown with visual charts |

### 🤖 AI & Intelligence
- **Layer 1 Verification**: Regex hard rules, date expiry checks, Levenshtein name matching
- **Layer 2 Verification**: Pinecone vector similarity + Groq LLM semantic analysis
- **RAG Chatbot**: Pinecone-indexed statutory knowledge base answering compliance questions
- **CAD Pre-Scrutiny**: Technical drawing analysis using Groq vision

---

## 🗺️ Statutory Sectors Covered

| Sector | Key Clearances |
|---|---|
| **⚙️ Boiler** | IBR Registration, Safety Valve Cert, Boiler Attendance Certificate, PESO NOC |
| **🌿 Pollution** | SPCB Consent to Establish (CTE), Consent to Operate (CTO), CPCB Authorization, Environmental Impact Assessment |
| **🏗️ Factory License** | Factory Plan Approval, Occupier Registration, Fire NOC, Electrical Safety Certificate |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ANUMATI Platform                          │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Entrepreneur  │    │   Officer    │    │  Public      │  │
│  │  Dashboard   │    │  Dashboard   │    │  Landing     │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │           │
│  ┌──────▼───────────────────▼───────────────────▼───────┐  │
│  │              Next.js 14 App Router (RSC)             │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │ API Routes                         │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │                   Service Layer                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │  OCR        │  │ Topological  │  │  CAD        │  │  │
│  │  │  + 2-Layer  │  │  DAG Engine  │  │  Scrutiny   │  │  │
│  │  │  AI Verify  │  │  (Kahn's)    │  │  Service    │  │  │
│  │  └──────┬──────┘  └──────────────┘  └─────────────┘  │  │
│  └─────────┼──────────────────────────────────────────────┘  │
│            │                                                 │
│  ┌─────────▼──────────────────────────────────────────────┐  │
│  │                   Data Layer                            │  │
│  │   MongoDB Atlas    │   Pinecone Vector DB   │   Groq    │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, RSC) |
| **Language** | TypeScript 5 |
| **Database** | MongoDB Atlas + Mongoose ODM |
| **AI / LLM** | Groq (Llama 3, Mixtral) |
| **Vector DB** | Pinecone (RAG pipeline) |
| **Auth** | HTTP-only JWT cookies + bcrypt |
| **Styling** | Tailwind CSS + custom gov-navy/gold theme |
| **Testing** | Jest + ts-jest (64 tests, 14 suites) |
| **Validation** | Zod schema validation |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (free tier works)
- Pinecone account (free tier works)
- Groq API key (free at console.groq.com)

### 1. Clone the repo

```bash
git clone https://github.com/Nishanth734/sih-anumati.git
cd sih-anumati
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/anumati

# Auth
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars

# Groq LLM
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Pinecone Vector DB
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_INDEX_NAME=anumati-statutory-docs

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Seed the database

```bash
npx ts-node scripts/seed.ts
```

This creates demo accounts:

| Role | Email | Password |
|---|---|---|
| Entrepreneur | `entrepreneur@company.com` | `Password123!` |
| Boiler Officer | `officer.boiler@gov.in` | `Password123!` |
| Pollution Officer | `officer.pollution@gov.in` | `Password123!` |
| Factory Officer | `officer.factory@gov.in` | `Password123!` |

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

```bash
npm test                 # Run all 64 tests
npm test -- --coverage   # With coverage report
npx tsc --noEmit         # TypeScript type check
npm run build            # Production build check
```

**Test coverage:**
- Document verification pipeline (OCR + Layer 1 + Layer 2)
- Topological DAG computation (Kahn's algorithm)
- CAD pre-scrutiny service
- MRTPS SLA deadline engine
- API route handlers

---

## 📁 Project Structure

```
sih-anumati/
├── app/
│   ├── api/                     # API route handlers
│   │   ├── auth/                # Login, signup, logout, /me
│   │   ├── applications/        # CRUD + certificate generation
│   │   ├── documents/           # Upload + AI verification
│   │   ├── roadmap/             # Statutory roadmap data
│   │   └── chat/                # RAG chatbot endpoint
│   ├── dashboard/
│   │   ├── entrepreneur/        # Entrepreneur dashboard
│   │   └── officer/             # Officer review console
│   ├── application/[id]/
│   │   ├── upload/              # Document upload page
│   │   └── certificate/         # Certificate download
│   ├── roadmap/                 # Public roadmap explorer
│   ├── pre-scrutiny/            # CAD pre-scrutiny tool
│   ├── login/                   # Auth pages
│   └── signup/
├── components/
│   ├── Navbar.tsx               # Responsive sticky navbar
│   ├── Footer.tsx               # 4-column footer
│   ├── LoginForm.tsx            # Login with quick-fill
│   ├── RoadmapViewContainer.tsx # Tabbed roadmap view
│   ├── TopologicalDAGView.tsx   # DAG visualizer
│   └── EntrepreneurProfileForm.tsx
├── lib/
│   ├── topologicalService.ts    # Kahn's algorithm DAG engine
│   ├── cadScrutinyService.ts    # CAD AI analysis
│   ├── mongodb.ts               # DB connection
│   └── auth.ts                  # JWT utilities
├── models/                      # Mongoose schemas
│   ├── User.ts
│   ├── Application.ts
│   └── Document.ts
├── scripts/
│   └── seed.ts                  # Database seeder
└── __tests__/                   # Jest test suites
```

---

## 🎯 How It Works — Key Flows

### Document Verification Pipeline
```
Entrepreneur uploads PDF
        ↓
    OCR Extraction (text from PDF)
        ↓
    Layer 1: Hard Rules
    • Regex field validation
    • Expiry date check
    • Levenshtein name match
        ↓
    Layer 2: AI Semantic Check
    • Pinecone vector similarity
    • Groq LLM contextual analysis
        ↓
    Result: PASSED ✅ or FAILED ❌
        ↓
    All docs PASSED → Application auto-promoted to READY_FOR_REVIEW
```

### Topological Compliance Roadmap
```
User selects sector (Boiler / Pollution / Factory)
        ↓
    computeTopologicalTiers() runs Kahn's algorithm
    on STATUTORY_CLEARANCE_NODES graph
        ↓
    Returns tiers: [[Tier 1 nodes], [Tier 2 nodes], ...]
    (dependencies resolved — get Tier 1 first, then Tier 2, etc.)
        ↓
    Rendered as interactive DAG visualization
    with simulate-progress feature
```

---

## 👥 Team

**Smart India Hackathon 2024**

| Member | Role |
|---|---|
| Nishanth | Full Stack + AI Integration |
| Pranav | Backend + Database |
| *(Add your team)* | *(Add roles)* |

---

## 📄 License

This project was built for **Smart India Hackathon 2024**. All rights reserved by the team.

---

<div align="center">
Made with ❤️ for Smart India Hackathon 2026<br/>
<strong>ANUMATI — अनुमति</strong> | Empowering Industrial India
</div>
