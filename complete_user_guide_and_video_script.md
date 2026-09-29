# 📖 ANUMATI — Complete User Guide & End-to-End Video Script

This is the **complete, click-by-click master guide and script** for the ANUMATI Single-Window Industrial Clearance Platform. It explains **what each feature does, what appears on every screen, what you should click, and the exact words to say** during your YouTube demo video or hackathon presentation.

---

## 🗂️ Table of Contents
1. [Test Credentials & Demo Data](#1-test-credentials--demo-data)
2. [Phase 1: Portal Landing Page & Mission Overview](#phase-1-portal-landing-page--mission-overview)
3. [Phase 2: Fresh Industrialist Registration](#phase-2-fresh-industrialist-registration)
4. [Phase 3: The Entrepreneur Dashboard (What Everything Means)](#phase-3-the-entrepreneur-dashboard-what-everything-means)
5. [Phase 4: Linking Verified Corporate Profile (DigiLocker / API Setu)](#phase-4-linking-verified-corporate-profile-digilocker--api-setu)
6. [Phase 5: Filing an Application (AI OCR Auto-Extraction)](#phase-5-filing-an-application-ai-ocr-auto-extraction)
7. [Phase 6: Dual-Layer Document Upload & Verification Engine](#phase-6-dual-layer-document-upload--verification-engine)
8. [Phase 7: The Statutory Roadmap & Kahn's Topological DAG](#phase-7-the-statutory-roadmap--kahns-topological-dag)
9. [Phase 8: CAD & Spatial Setback Pre-Scrutiny Tool](#phase-8-cad--spatial-setback-pre-scrutiny-tool)
10. [Phase 9: Statutory AI Regulatory Assistant (Pinecone RAG + Groq)](#phase-9-statutory-ai-regulatory-assistant-pinecone-rag--groq)
11. [Phase 10: Officer Scrutiny Console & Rejection Analytics](#phase-10-officer-scrutiny-console--rejection-analytics)
12. [Phase 11: Digitally Signed Statutory Certificate](#phase-11-digitally-signed-statutory-certificate)

---

## 1. Test Credentials & Demo Data

Use these exact values so all form validations (PAN format `ABCDE1234F`, GSTIN 15-character Modulus 36 checksum) pass effortlessly:

### 🎥 Official Demo Profile (For Recording):
* **Full Name**: `Vikramaditya Singhania`
* **Email**: `v.singhania@bharatalloys.com`
* **Password**: `Password123!`
* **Industry Sector**: `Boiler`
* **Company Name**: `Bharat Heavy Alloys & Forgings Ltd`
* **Business PAN**: `AAACB1947F`
* **GSTIN**: `27AAACB1947F1Z9`
* **Registered Unit Address**: `Plot 104, GIDC Industrial Estate, Phase 3, Vadodara, Gujarat 390010`
* **Phone Number**: `9879504411`

### 🏛️ Pre-Seeded Officer Profile:
* **Boiler Officer Email**: `officer.boiler@gov.in`
* **Password**: `Password123!`
* **Officer Name**: `Dr. Vikram Seth (Chief Inspector of Boilers)`

---

## Phase 1: Portal Landing Page & Mission Overview

### 🖥️ What Happens on Screen:
Open `http://localhost:3000`. You see:
1. **Official Top Bar**: Indian Tricolor accent line with the ANUMATI emblem.
2. **Hero Banner**: *"Single-Window Industrial Clearance & Licensing Portal"* with call-to-actions.
3. **3 Interactive Module Cards**: Direct entry points to **Topological DAG Roadmap**, **CAD Setback Pre-Scrutiny**, and **Statutory AI Assistant**.
4. **3 Regulated Sectors**:
   - **Boiler Inspection & Safety** (*Indian Boilers Act 1923*)
   - **Pollution Control Board NOC** (*Water Act 1974 & Air Act 1981*)
   - **Factory License & Safety** (*Factories Act 1948*)
5. **Feature Highlights Grid**: Fast-Track SLA, Role-Based Security, Dual-Layer Verification, Cryptographic Audit Trail.

### 🎙️ What to Say:
> *"Welcome to ANUMATI. In India today, setting up an industrial manufacturing plant requires navigating multiple disjointed government departments—Steam Boiler Inspectorates, State Pollution Boards, and Industrial Safety Directorates. 
> 
> Currently, an entrepreneur waits an average of 90 to 180 days, facing bureaucratic delays, unexpected drawing rejections, and repeated physical visits.
> 
> ANUMATI solves this by building India's first unified digital single-window portal powered by automated CAD setback checking, Kahn's algorithm topological roadmaps, and dual-layer AI document verification."*

---

## Phase 2: Fresh Industrialist Registration

### 🖥️ What Happens on Screen:
1. In the top right, click **"Register Unit"** (routes to `/signup`).
2. Notice the role switcher at the top: **Entrepreneur / Industrialist** vs **Government Officer**. Leave it on **Entrepreneur**.
3. Fill in the form fields:
   - Full Name: `Vikramaditya Singhania`
   - Official Email: `v.singhania@bharatalloys.com`
   - Password: `Password123!`
   - Sector: Select `Boiler Licensing & Safety`
   - Business PAN: Type `aaacb1947f` *(notice it automatically auto-capitalizes to `AAACB1947F` and validates syntax)*
   - Company Name: `Bharat Heavy Alloys & Forgings Ltd`
   - Registered Factory Address: `Plot 104, GIDC Industrial Estate, Phase 3, Vadodara, Gujarat 390010`
4. Click **"Complete Registration"**.
5. The system hashes the password with bcrypt (cost factor 12), sets an authenticated HTTP-only JWT cookie, initializes an empty compliance profile, and smoothly redirects to `/dashboard/entrepreneur`.

### 🎙️ What to Say:
> *"Let's start from a clean slate by registering a brand-new industrial enterprise. Notice that our form features real-time validation for statutory formats like Indian Business PAN numbers.
> 
> As soon as the user submits, their credentials are encrypted with bcrypt cost factor 12, an immutable audit event is logged, and they are brought straight into their customized Entrepreneur Portal."*

---

## Phase 3: The Entrepreneur Dashboard (What Everything Means)

### 🖥️ What Happens on Screen:
You land on `http://localhost:3000/dashboard/entrepreneur`. Explain each visual section to the viewer:
1. **Corporate Welcome Banner**:
   - Displays *"Welcome, Vikramaditya Singhania • Bharat Heavy Alloys & Forgings Ltd"*.
   - Shows badge pills: `PAN: AAACB1947F`, `Sector: Boiler`.
   - Has a direct link: *"Edit Compliance Profile"*.
2. **4 KPI Metric Cards**:
   - **Total Filings**: Currently `0` (fresh account).
   - **In Progress / Pending**: Currently `0`.
   - **Approved Licenses**: Currently `0`.
   - **Action Needed / Rejected**: Currently `0`.
3. **Recommended Government Schemes & Subsidies Widget**:
   - Located below the metrics.
   - Displays matching government financial incentive schemes (e.g., *Boiler Modernization Capital Subsidy*, *ZED Certification Reimbursement*, *Clean Energy ETP Grants*) tailored to their chosen sector with financial subsidy percentages!
4. **Clearance Applications History Table**:
   - Shows an empty state: *"No clearance applications filed yet. File your first application now →"*.

### 🎙️ What to Say:
> *"Here is the Entrepreneur Dashboard. At a single glance, the business owner sees their corporate identification badges, real-time filing counts, and statutory subsidy recommendations tailored to their manufacturing sector.
> 
> Before filing our first application, let's complete our corporate profile using the national DigiLocker integration."*

---

## Phase 4: Linking Verified Corporate Profile (DigiLocker / API Setu)

### 🖥️ What Happens on Screen:
1. In the header banner, click **"Edit Compliance Profile"** (routes to `/profile`).
2. Show the profile form with Company Name, PAN, GSTIN, Address, Phone, and Sector.
3. Point out the button: **"Fetch from DigiLocker / API Setu"**.
4. Click **"Fetch from DigiLocker"**.
5. A brief spinner runs for 600ms, and then **GSTIN (`27AAACR1234K1ZI`)**, verified corporate address, and phone number are automatically populated!
6. A green toast appears: *"Retrieved verified corporate credentials via DigiLocker / API Setu National Gateway."*
7. Click **"Save Corporate Profile"** &rarr; Green checkmark confirms update.
8. Click **"Dashboard"** in the top navbar to return.

### 🎙️ What to Say:
> *"To ensure data integrity, ANUMATI integrates with API Setu and DigiLocker. 
> 
> Rather than manually typing in complex tax IDs and risking transcription errors, the entrepreneur clicks 'Fetch from DigiLocker'. The portal instantly retrieves verified GSTIN credentials and registered plant addresses from government databases, ready for auto-population."*

---

## Phase 5: Filing an Application (AI OCR Auto-Extraction)

### 🖥️ What Happens on Screen:
1. On the dashboard, click the gold button: **"File New Application"**.
2. A sleek modal opens. Explain that it supports two modes:
   - **Upload Project Report (DPR) / PDF**: Uses server-side OCR to automatically parse and extract application title, investment budget, and plant location.
   - **Manual Specification**: Allows direct entry.
3. Fill in the application fields:
   - **Application Title**: `High Pressure Steam Boiler Operational License Unit 4`
   - **Sector**: `Boiler` (pre-selected)
   - **Estimated Investment Budget (INR)**: `18500000` *(1.85 Crores)*
   - **Plant Coordinates / Location**: `Plot 104, GIDC Industrial Estate, Vadodara, Gujarat`
   - **Brief Technical Summary**: `Installation of 50-ton per hour water tube steam boiler with dual spring-loaded safety relief valves and economizer.`
4. Click **"Submit Clearance Application"**.
5. The modal closes. In the applications table, **Application `#ANM-BOILER-2026-XXXX`** appears immediately with:
   - Title & budget
   - Status badge: `PENDING` (with SLA countdown timer tracking government deadline)
   - Action Button: **"Upload Documents"** with an upload icon.

### 🎙️ What to Say:
> *"Now we file our clearance application. The entrepreneur inputs their equipment specifications and project budget. 
> 
> Notice how the system automatically assigns a statutory tracking number and establishes a legally binding SLA countdown timer under the State Public Services Guarantee Act.
> 
> Now, let's proceed to the most critical step: Document Upload and Verification."*

---

## Phase 6: Dual-Layer Document Upload & Verification Engine

### 🖥️ What Happens on Screen:
1. In the application row, click **"Upload Documents"** (routes to `/application/[id]/upload`).
2. Point out the top header:
   - Shows Sector badge (`Boiler Sector`), App ID, Firm Name.
   - Status bar: *"Incomplete — 0 of 4 Statutory Documents Verified"*.
3. Point out the **"ANUMATI Dual-Layer Verification Engine"** explanation card:
   - **Layer 1 (Hard Rules)**: Validates regex formats, document expiry dates, and fuzzy-matches the company name with profile records.
   - **Layer 2 (Statutory RAG Audit)**: Uses Groq LLM to verify that the uploaded document text satisfies statutory requirements under the *Indian Boilers Act 1923*.
4. Show the **4 Statutory Document Slots**:
   - **Slot 1**: Business PAN Card
   - **Slot 2**: GSTIN Registration Certificate
   - **Slot 3**: Approved Boiler Site Layout & Foundation Plan
   - **Slot 4**: Pressure Vessel Inspection & Safety NOC (Form II & III)
5. **Demonstrate Upload**:
   - Drag or click to upload sample documents into the slots.
   - When a document is dropped, a spinner pulses: *"Verifying..."*.
   - The server performs OCR extraction, validates Modulus 36 checksums on GSTIN, verifies PAN syntax, and matches against Pinecone vector embeddings.
   - The badge transitions to a green **"PASSED"** badge.
   - Once all mandatory slots pass, a celebration banner appears:  
     *"All Statutory Documents Passed! Application auto-promoted to READY_FOR_REVIEW."*

### 🎙️ What to Say:
> *"Here is ANUMATI's groundbreaking **Dual-Layer Verification Engine**.*
> 
> *In traditional single windows, uploaded PDFs sit unread in officer inboxes for weeks before someone notices an expired certificate or mismatched name.
> 
> In ANUMATI, every uploaded document undergoes instant server-side scrutiny through two distinct layers:
> 1. **Layer 1 Hard Rules**: Performs regex checks, date validity audits, and Levenshtein fuzzy matching against company records.
> 2. **Layer 2 Statutory RAG Audit**: Uses Pinecone vector search and Groq LLM inference to confirm that mandatory clauses—such as maximum allowable working pressure ratings and hydrostatic test logs under the Indian Boilers Act—are explicitly present.
> 
> If an applicant uploads an expired document or missing clauses, the system pinpoints the exact failure reason in seconds, allowing immediate re-upload before human officers ever waste time."*

---

## Phase 7: The Statutory Roadmap & Kahn's Topological DAG

### 🖥️ What Happens on Screen:
1. In the top navbar, click **"Roadmap"** (routes to `/roadmap`).
2. Explain the **Interactive Topological DAG View**:
   - At the top are 3 Category pills: **Green**, **Orange**, **Red**.
3. **Demonstrate the Green Fast-Track**:
   - Click **"Green Category"**.
   - A green advisory box appears: *"Green Category (Pollution Index < 20): Fast-track 48-hour statutory clearance. Exempt from extensive Environmental Impact Assessment (EIA) and heavy effluent CTE approvals."*
   - Heavy industrial approval nodes disappear from the graph!
4. **Demonstrate Topological Dependency Unlocking (Kahn's Algorithm)**:
   - Click **"Orange Category"**.
   - Notice that Tier 0 has **Industrial Plot Allotment (MIDC-01)**.
   - Tier 1 has **Fire Safety NOC** and **Consent to Establish (CTE)**.
   - Notice they both depend on MIDC-01!
   - In the graph, click **"Industrial Plot Allotment"** &rarr; click **"Simulate Clearance"**.
   - Watch the Tier 1 nodes instantly unlock from **LOCKED 🔒** to **READY 🟢**!
5. **Show Statutory Legal Inspection Drawer**:
   - Click on the **"Factory Building Plan (DISH-04)"** card.
   - A detail panel opens showing:
     - Statutory Legal Act: *Factories Act, 1948 (Section 6)*
     - Processing Timeline: *10 Working Days (Mandated under MRTPS Act)*
     - Full regulatory description and list of required prerequisite approvals.
6. **Switch to Linear Sector Checklist Tab**:
   - Click **"Linear Sector Checklist"**.
   - Switch between **Boiler**, **Pollution**, and **Factory License**.
   - Expand **Stage 1 (Factory Site Clearance)** to show the exact list of legally required documents.

### 🎙️ What to Say:
> *"Now let's examine the **Statutory Clearance Roadmap**. Government licensing is not a simple linear checklist; multiple clearances must run in parallel, while others have strict legal prerequisites.
> 
> ANUMATI models the entire clearance ecosystem as a **Topological Directed Acyclic Graph (DAG)** evaluated via **Kahn's Algorithm**.
> 
> For **Green Category** manufacturing units, our engine automatically detects their low pollution index and fast-tracks the approval pipeline within 48 hours, bypassing public hearings.
> 
> For Orange and Red units, the DAG automatically computes parallel execution tiers. As seen here, once Land Allotment is secured, Fire NOC and Pollution CTE can be applied for simultaneously.
> 
> Clicking any approval node reveals the exact governing legal act, statutory SLA deadlines, and prerequisite dependencies."*

---

## Phase 8: CAD & Spatial Setback Pre-Scrutiny Tool

### 🖥️ What Happens on Screen:
1. In the top navbar, click **"CAD Pre-Scrutiny"** (routes to `/pre-scrutiny`).
2. Explain the workspace:
   - Left side: Interactive HTML5 Canvas showing an **80m x 60m industrial plot** with outer boundary walls, inner setback boundaries, and the equipment unit.
   - Right side: Control panel with unit type selector (Boiler, Chemical Reactor, Fuel Tank), coordinate sliders, and the Compliance Scrutiny Report.
3. **Demonstrate Violation Scenario**:
   - Click **"Sample: Buffer Violation (10.5m)"**.
   - The canvas updates immediately. The equipment moves close to the south boundary (Y = 10.5m).
   - The dimension line turns **RED** (`10.5m setback`).
   - The scrutiny report displays:
     - **Status**: `NON_COMPLIANT` (Red alert badge).
     - **Statutory Violation**: *Equipment placed 10.5m from boundary; violates mandatory 15-meter buffer rule under MIDC DCR Section 14.2 & NBC 2016 Part 4.*
     - **Remediation Advice**: *Shift equipment at least 4.5m inward to clear perimeter safety envelope.*
4. **Demonstrate Compliant Scenario**:
   - Click **"Sample: Compliant Buffer (24.5m)"**.
   - The equipment shifts into the safe zone (Y = 24.5m).
   - The dimension line turns **EMERALD GREEN** (`24.5m setback`).
   - The status updates to **COMPLIANT** (`Passed 15.0m Minimum Setback`).
   - At the bottom, highlight the **Cryptographic SHA-256 Compliance Hash** generated for audit trails!
5. Drag the X or Y slider slightly to show how the canvas calculates distances in real time at 60 FPS.

### 🎙️ What to Say:
> *"Here is one of ANUMATI's most powerful capabilities: **CAD & Spatial Setback Pre-Scrutiny**.*
> 
> *Under the National Building Code 2016 and MIDC Development Control Regulations, hazardous equipment—such as steam boilers and chemical reactors—must maintain a mandatory 15-meter buffer from factory perimeter boundaries.*
> 
> *In current systems, factory owners hire draftsmen, file blueprinted drawings, and wait weeks for physical inspections only to receive a rejection notice because of a 1-meter setback error.*
> 
> *With ANUMATI, industrialists test their machinery layout before filing. Loading our violation preset demonstrates how the engine instantly catches a 10.5-meter setback violation and provides specific remediation coordinates.*
> 
> *When we load a compliant 24.5-meter layout, the system validates statutory compliance in milliseconds and stamps it with an immutable SHA-256 audit hash."*

---

## Phase 9: Statutory AI Regulatory Assistant (Pinecone RAG + Groq)

### 🖥️ What Happens on Screen:
1. In the top navbar, click **"Statutory AI"** (routes to `/chat`).
2. Show the chat interface:
   - Sector dropdown (`Boiler`, `Pollution`, `Factory License`).
   - Suggested statutory prompt chips.
3. Select **"Boiler"** sector.
4. Click the suggested prompt: *"What are the hydrostatic pressure test requirements for boiler registration?"*
5. Groq LLM streams the response in real time:
   - Explains that under Section 6 & 7 of the Indian Boilers Act 1923, tests must be conducted at 1.5 times the maximum allowable working pressure (MAWP) for at least 30 minutes.
   - Highlights the legal citation box at the bottom: **`Indian Boilers Act 1923, Section 6 & 7`**.
6. Switch to **"Pollution"** sector and ask: *"What are the chimney stack height requirements for Consent to Establish?"*. Show the CPCB formula response.

### 🎙️ What to Say:
> *"Navigating complex legal gazettes can be daunting. Our **Statutory AI Assistant** connects high-speed Groq LLM inference with a Pinecone vector database populated with Indian industrial acts.*
> 
> *Instead of hallucinatory answers, the assistant retrieves statutory rule chunks directly from verified legal codes. When we ask about hydrostatic testing, it quotes the exact statutory sections of the Indian Boilers Act 1923, citing required pressure multiples and inspector sign-off protocols."*

---

## Phase 10: Officer Scrutiny Console & Rejection Analytics

### 🖥️ What Happens on Screen:
1. In the top navbar, click the **Sign Out** button.
2. Click **"Log In"** &rarr; click the **"Clearance Officer"** quick-fill button (`officer.boiler@gov.in` / `Password123!`).
3. Click **"Sign In to Dashboard"** &rarr; Lands on `/dashboard/officer`!
4. **Highlight the Rejection Analytics Panel**:
   - At the top of the officer dashboard is the **Rejection Analytics Panel**.
   - Show the interactive Pareto chart breaking down why applications get rejected (e.g., *Incomplete Site Layout Specifications*, *Missing Structural Engineer Certificates*, *Effluent Non-Compliance*).
5. **Show the Review Queue**:
   - Scroll to the **Assigned Review Queue** table.
   - Notice the application submitted earlier by *Bharat Heavy Alloys & Forgings Ltd* (`#ANM-BOILER-2026-XXXX`).
   - Click the blue **"Review Application"** button.
6. **Show Side-by-Side OCR Scrutiny Modal**:
   - A detailed scrutiny modal opens.
   - Highlights the applicant's entered budget and location side-by-side with OCR-extracted values and similarity match percentages.
7. **Approve the Application**:
   - In the Review Remarks box, type:  
     `Verified maker Form II & III certificates, site layout clearances, and hydraulic test parameters under IBR 1950. Statutory approval granted.`
   - Click the green **"Approve Application"** button.
   - The status updates instantly to **APPROVED** with a green badge!

### 🎙️ What to Say:
> *"Now let's switch to the government side. We log in as Dr. Vikram Seth, the designated Boiler Clearance Officer.*
> 
> *Notice our **Rejection Analytics Panel**. By aggregating application rejections across districts, departments can identify systemic bottlenecks—such as structural certificate errors—and proactively publish guidelines.*
> 
> *In the officer queue, the officer opens our pending application. The system provides side-by-side verification comparing the applicant's self-declarations against OCR extracted parameters with similarity confidence scores.*
> 
> *Satisfied with compliance under Indian Boiler Regulations, the officer enters statutory remarks and signs off on the clearance with a single click."*

---

## Phase 11: Digitally Signed Statutory Certificate

### 🖥️ What Happens on Screen:
1. In the approved application row, click the gold button: **"View Certificate"** (routes to `/application/[id]/certificate`).
2. The official, publication-ready **Statutory Clearance Certificate** renders on screen:
   - Official Government of India Header & State Ashoka Emblem styling.
   - Unique Certificate Number: `CERT-BOILER-2026-XXXX`.
   - Authorized Enterprise: `Bharat Heavy Alloys & Forgings Ltd`.
   - Clearances Granted: Operating authorization under *Indian Boilers Act 1923*.
   - Verification QR Code & Validity Period (3 Years).
   - Tamper-proof **SHA-256 Digital Signature Hash**.
3. In the top right, click **"Print / Save as PDF"** &rarr; Show the clean browser print preview with header navigation cleanly hidden!
4. Return to the home page or dashboard to conclude.

### 🎙️ What to Say:
> *"Upon officer approval, ANUMATI instantly synthesizes an official, legally enforceable **Statutory Clearance Certificate**.*
> 
> *It features an immutable SHA-256 digital signature hash, an encrypted verification QR code for field inspectors, and full statutory terms of operation.*
> 
> *Through ANUMATI, we replace months of opaque paperwork, repeated rejections, and administrative friction with an automated, transparent, and provably secure 48-hour single-window experience.*
> 
> *Thank you!"*

---

## 🎯 Quick Recording Checklist Before You Hit Record
* [ ] Local MongoDB is running.
* [ ] `npm run dev` is running on `http://localhost:3000`.
* [ ] Screen recording resolution set to **1080p (1920x1080)**.
* [ ] Browser zoom set to **100%** or **110%**.
* [ ] Browser bookmarks bar hidden (`Ctrl + Shift + B`) for clean visuals.
* [ ] Keep this guide open on a second monitor or phone to guide your narration.
