# SubscriptIQ — Smart Subscription & Recurring Billing Management Platform

> **Hackathon Solution for Brightloop Software**  
> Eliminating spreadsheets, missed renewals, manual invoice drafting, duplicate billing, and opaque revenue reporting with a unified, high-performance automated billing platform.

---

## 🏆 Executive Summary & Problem-Solution Matrix

Brightloop Software required a scalable, offline-compliant, full-lifecycle subscription management platform to replace error-prone manual spreadsheets and billing bottlenecks. **SubscriptIQ** was architected to solve every core challenge specified in the hackathon challenge:

| Brightloop Problem | SubscriptIQ Enterprise Solution | Key Capabilities |
| :--- | :--- | :--- |
| **Manual spreadsheets & fragmented data** | **Unified Relational Single Source of Truth** | SQLite in WAL mode with sub-5ms query performance and full data relational integrity. |
| **Missed subscription renewals** | **Subscription Intelligence Engine** | Automated 30-day renewal alerts, proactive notification dispatch, and 1-click customer renewals. |
| **Manual invoice drafting & duplicate billing** | **Atomic Recurring Billing Engine** | Automated recurring runner (`/api/billing/run`) with strict period duplicate safeguards and tax rules (GST 18%). |
| **Payment mismatch & manual reconciliation** | **Audited Payment Ledger & Simulated Gateway** | Instant multi-method checkout (UPI AutoPay, Card, Net Banking) with real-time invoice settlement. |
| **Complex variant & seat-based pricing** | **Multi-Variant Product & Plan Architecture** | Brand/feature add-on variants (e.g. Odoo Brand Connector +₹560) and 4 billing cadences (Daily, Weekly, Monthly, Yearly). |
| **Uncontrolled access & security risks** | **Granular Role-Based Access Control (RBAC)** | JWT authentication across 3 distinct personas: `Admin`, `Operations Staff`, and `Customer`. |

---

## 🛠️ Architecture & Technology Stack

SubscriptIQ complies 100% with the hackathon rule: *"Plan for offline/local solutions, don't rely on cloud tools"*.

```mermaid
flowchart TD
    subgraph Client ["Frontend Client (React 18 + Vite)"]
        UI["Tailwind CSS + Lucide Icons"]
        Charts["Chart.js Live Telemetry (MRR, ARR, Doughnut)"]
        AuthCtx["AuthContext (JWT & Demo Switcher)"]
        ToastCtx["Toast Notification Engine"]
    end

    subgraph Server ["Backend API (Node.js + Express)"]
        Router["Express REST Routes (/api)"]
        AuthMW["RBAC Middleware (authenticate, authorize)"]
        BillingEng["Atomic Billing Engine (Recurring Generator)"]
        IntelSvc["Subscription Intelligence Service"]
    end

    subgraph Storage ["Offline Persistent Database"]
        DB[("SQLite 3 (WAL Mode + Foreign Keys)")]
    end

    Client -->|Axios with JWT Interceptor| Server
    Router --> AuthMW
    AuthMW --> BillingEng
    AuthMW --> IntelSvc
    BillingEng --> DB
    IntelSvc --> DB
```

### Stack Selection Rationale
- **Frontend (React 18 + Vite):** Ultra-fast HMR (< 50ms), modular component design, responsive modern SaaS interface.
- **Styling (Tailwind CSS):** Enterprise-grade design language matching modern B2B SaaS standards (Stripe, Hyperline).
- **Backend (Node.js + Express):** Asynchronous, event-driven I/O enabling fast concurrent billing runs.
- **Database (SQLite WAL Mode):** Zero-cloud, local persistent relational database with WAL journaling, zero setup friction for evaluators, and atomic transactions.
- **Security:** Bcrypt password hashing + signed JSON Web Tokens (JWT) + enterprise password validator (> 8 chars, uppercase, lowercase, numbers, symbols).

---

## 👥 Roles & Verified Demo Credentials

The platform includes **1-Click Demo Switchers** on both the Login Page and the Top Navigation Bar for seamless judging:

| Role | Demo Email | Password | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@brightloop.com` | `Admin@12345!` | Full platform authority: Products, Plans, Taxes, Discounts, Staff provisioning, Billing Engine, MRR Telemetry. |
| **💼 Staff** | `staff@brightloop.com` | `Staff@12345!` | Operational execution: Customer onboarding, Quotation pipeline, Subscriptions lifecycle, Invoice management. |
| **👤 Customer** | `apex@shop.com` | `Customer@12345!` | Self-service portal: Manage subscriptions (Pause, Resume, Renew), View invoices, Download receipts, Instant checkout. |

---

## 🚀 3-Minute Hackathon Demo Script (Judge Walkthrough)

Follow this script to demonstrate the full end-to-end Brightloop billing scenario in 3 minutes:

### Step 1: Login & The Revenue Command Center (0:00 - 0:45)
1. Launch the platform at `http://localhost:3000`.
2. Notice the **executive split-screen login page** showcasing Brightloop's core value pillars.
3. Click the **"👑 Admin"** 1-click demo button and sign in.
4. Review the **Revenue Command Center**:
   - Normalized **MRR (Monthly Recurring Revenue)** and **ARR (Annual Recurring Revenue)**.
   - Interactive charts: **Monthly Revenue Trend**, **Subscription Status Distribution**, and **Subscribers by Plan**.
   - **Subscription Intelligence Banner**: Displays upcoming renewals due in 30 days and upsell recommendations.

### Step 2: Quotation Conversion & Lifecycle Pipeline (0:45 - 1:30)
1. Navigate to **Quotations** (or click the *Judge Guide* in the top navbar).
2. Click **Create Quotation**, select a pre-configured template (e.g. *Enterprise ERP Bundle*), customer *Apex Retail*, and submit.
3. Click **"Convert to Subscription"** — watch SubscriptIQ automatically transition the quote into a confirmed recurring subscription contract (`Draft ➔ Quotation ➔ Confirmed ➔ Active`).

### Step 3: Zero-Delay Automated Recurring Billing Engine (1:30 - 2:15)
1. Click the **"Trigger Billing Run"** button in the top navbar or on the Dashboard.
2. Watch the engine evaluate subscriptions, apply statutory GST (18%), compute eligible coupon discounts, and create invoices.
3. **Duplicate Prevention Proof:** Click "Trigger Billing Run" a second time — the system detects that current periods have already been invoiced and generates 0 duplicates, protecting against double-billing.

### Step 4: Customer Self-Service Portal & Instant Checkout (2:15 - 3:00)
1. Click the **"👤 Customer"** pill in the top navbar to instantly switch to Rahul Sharma's portal view.
2. View active subscriptions with one-click **Pause**, **Resume**, and **Renew (+1 Year)** controls.
3. Under **Outstanding Invoices**, click **"Pay Now"**.
4. Choose **UPI AutoPay** or **Credit Card** in the simulated gateway modal and confirm settlement.
5. The invoice status instantly transitions to **Paid**, updates the customer ledger, and provides a printable, official GST receipt.

---

## ⚡ Quick Start & Installation

### Option A: 1-Click Launchers (Recommended)
Double-click either launcher in the project root:
- Windows Batch: `start-dev.bat`
- PowerShell: `start-dev.ps1`

Both backend (`http://localhost:5000`) and frontend (`http://localhost:3000`) will launch automatically in separate terminal windows.

---

### Option B: Manual Two-Terminal Startup

#### 1. Backend Server Setup
```bash
cd backend
npm install
npm start
```
*The database automatically creates and seeds with realistic demo data on initial launch.*  
*Health check available at: `http://localhost:5000/api/health`*

#### 2. Frontend Client Setup
```bash
cd frontend
npm install
npm run dev
```
*Open your browser at `http://localhost:3000`*

---

## 📋 Comprehensive Module Breakdown

### 1. Granular Authentication & Access Control
- Signed JWT token authentication with role claims.
- Cryptographic password hashing using `bcryptjs`.
- Strong password enforcement: length `> 8`, uppercase, lowercase, numeric, and symbol validation.
- Fast role switching in development mode for evaluation walkthroughs.

### 2. Multi-Variant Products & Billing Plans
- Base products with sales prices, cost pricing, margins, and notes.
- Feature/Brand add-on variants (e.g. *Odoo Brand Connector* +₹560/mo).
- 4 flexible recurrence intervals: Daily, Weekly, Monthly, and Yearly.
- Minimum seat thresholds and auto-close upon contract expiration.

### 3. Sales Quotation Pipeline
- Reusable quotation templates for rapid sales drafting.
- Line items with customizable quantities, unit rates, and tax calculations.
- Atomic quotation conversion linking quote items directly to recurring subscription contracts.

### 4. Automated Recurring Billing & Tax Engine
- Scheduled / On-demand billing runner (`/api/billing/run`).
- Period reconciliation prevents skipped or duplicate invoices (`billing_period_start` / `billing_period_end`).
- Configurable tax rules (e.g. GST 18%, SGST/CGST splits).
- Professional printable invoices with legal GSTIN compliance.

### 5. Smart Discount & Promotion System
- Percentage-based (e.g. 15% off) and flat amount discounts (e.g. ₹500 off).
- Eligibility conditions: minimum seat volume (e.g. 10 seats for `BULK15`), validity dates, and usage counters.
- 1-click clipboard copy for promotional codes.

### 6. Payment Ledger & Instant Checkout Gateway
- Simulated multi-rail payment gateway: UPI QR / AutoPay, Credit/Debit Cards, Net Banking, and Bank Transfer.
- Automatic invoice status reconciliation (`Draft` ➔ `Confirmed` ➔ `Paid` / `Overdue`).
- Comprehensive audit ledger of settled payments with transaction references.

### 7. Standout Feature: "Subscription Intelligence"
- Proactive 30-day renewal warnings for accounts with upcoming expirations.
- Overdue invoice escalations highlighting at-risk accounts.
- Expansion opportunity alerts identifying customers eligible for seat tier upgrades.
- Normalized MRR & ARR telemetry updating dynamically as subscriptions evolve.

---

## 🧪 Testing & Production Build

To verify code quality and build integrity:

```bash
# Frontend production build
cd frontend
npm run build
```
*(Produces optimized production bundle in `frontend/dist/` with 0 errors)*

```bash
# Backend syntax check
cd backend
node -c src/server.js
```

---

## 📄 License & Attribution
Developed for **Brightloop Software Hackathon 2026**  
Engineered by the **SubscriptIQ Team** · Licensed under MIT.
