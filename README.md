# SubscriptIQ — Smart Subscription & Recurring Billing Management Platform

> **Hackathon Solution for Brightloop Software**  
> Eliminating spreadsheets, missed renewals, manual invoice drafting, payment mismatch, and opaque revenue reporting with a unified, high-performance automated billing platform.

---

## 🏆 Tech Stack Selection & Justification

To guarantee success in this hackathon, we selected the **Fast-Iteration, High-Reliability Enterprise Stack**:

| Component | Selected Technology | Why It Wins The Hackathon |
| :--- | :--- | :--- |
| **Frontend** | **React 18 + Vite** | Instant HMR (< 50ms), modular component tree, lightning-fast rendering. |
| **Styling** | **Tailwind CSS** | Clean enterprise SaaS UI matching Stripe/Hyperline/Subsbase aesthetics. |
| **Icons & Visuals** | **Lucide React + Chart.js** | Interactive MRR trajectory, subscription status doughnuts, and cadence bars. |
| **Backend API** | **Node.js + Express** | High throughput, asynchronous non-blocking I/O for concurrent billing runs. |
| **Security & Auth** | **JWT + BCrypt** | Enterprise role-based access (Admin, Staff, Customer) + strong password policies. |
| **Database** | **SQLite (WAL Mode + Relational Indexes)** | **100% Offline & Local Compliant** (satisfies hackathon criteria: *"Plan for offline/local solutions, don't rely on cloud tools"*), zero database setup headaches for teammates/judges, persistent relational schema, sub-10ms queries. |

---

## 🚀 Key Modules Implemented

### 1. Module 1: Role-Based Authentication & Governance
- **3 Distinct Roles**:
  - `Admin`: Full control over plans, pricing, taxes, discounts, staff provisioning, and system intelligence.
  - `Staff`: Operational access to handle customers, quotations, subscriptions, invoices, and payments.
  - `Customer`: Dedicated customer portal to manage own subscriptions, browse catalog, view invoices, and settle bills.
- **Enterprise Password Policy**: Enforces `> 8 characters`, uppercase, lowercase, and special characters with real-time UI checklist.
- **Forgot Password Workflow**: Token-based password recovery.
- **1-Click Demo Switcher**: Instant role toggle in the top navigation bar to seamlessly present all three perspectives to judges.

### 2. Module 2: Products & Subscription Plans
- Products with sales price, cost price, margins, and notes.
- **Product Variants**: Brand-based or feature-based variants (e.g., **Odoo Brand Connector** adding ₹560).
- **Billing Frequencies**: Daily, Weekly, Monthly, and Yearly.
- Plan governance: Minimum seat quantity, start/end dates, auto-close on expiration toggle, pause/renew toggles.

### 3. Module 3: Quotation & Subscription Lifecycle
- **Quotation Templates**: Pre-configured plans and line items for sales reps.
- **1-Click Quotation Conversion**: Converts agreed quotations into confirmed recurring subscriptions.
- **Complete Status Lifecycle**: `Draft` ➔ `Quotation` ➔ `Confirmed` ➔ `Active` ➔ `Paused` ➔ `Closed`.
- Self-service controls to Pause, Resume, and Renew (+1 Year).

### 4. Module 4: Automated Recurring Billing & Invoicing Engine
- Automated billing runner (`/api/billing/run`):
  - Detects subscriptions due for billing.
  - Generates line items, applies statutory tax rules (e.g. GST 18%), and computes eligible coupon discounts.
  - **Duplicate Billing Safeguard**: Strict period verification (`billing_period_start` & `billing_period_end`) ensuring zero skipped or duplicated invoices.
- Clean printable / downloadable invoice format.
- Dispatches invoices via email notification simulation.

### 5. Module 5: Discount & Coupon Management
- Percentage-based (e.g. 15% off) or Fixed Amount (e.g. ₹500 off).
- Eligibility conditions: Minimum seat quantity (e.g., 10 seats for `BULK15`), validity dates, maximum usage limit.
- Automatic application to next eligible invoice during calculation.

### 6. Module 6: Payment Recording & Simulated Checkout Gateway
- Multi-method support: **UPI / QR (AutoPay)**, **Credit/Debit Card**, **Net Banking**, **NEFT/RTGS**, **Cash**.
- Instant settlement: Marks invoice as `Paid`, updates subscription to `Active`, clears outstanding balance, and generates payment receipt with transaction reference.

### 7. Module 7: Analytics & Standout Feature — "Subscription Intelligence"
- **Real-Time KPIs**:
  - Monthly Recurring Revenue (MRR) — normalized across daily, weekly, monthly, and yearly cadences.
  - Annual Recurring Revenue (ARR).
  - Total Settled Revenue.
  - Outstanding & Overdue Invoices.
  - Active Subscriber count.
- **AI Subscription Intelligence Banner**:
  - **Renewal Alerts**: Detects subscriptions expiring in the next 30 days.
  - **Payment Alerts**: Highlights overdue invoices requiring chase-down.
  - **Volume Upsell Insights**: Identifies customers with 5+ seats eligible for bulk discount tiers.
  - **Velocity**: MRR growth tracking.

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.com` | `Admin@12345!` | Complete system access & intelligence |
| **Staff** | `staff@brightloop.com` | `Staff@12345!` | Operational customer, invoice & quote access |
| **Customer 1** | `apex@shop.com` | `Customer@12345!` | Small shop (Monthly Plan, ₹999/mo) |
| **Customer 2** | `enterprise@techcorp.com` | `Customer@12345!` | Large enterprise (50 seats yearly contract) |
| **Customer 3** | `solopreneur@devstudio.io` | `Customer@12345!` | Confirmed pending initial invoice |

*(Note: The top navigation bar includes 1-click quick switch buttons between Admin, Staff, and Customer for live demos).*

---

## 🏃 Quick Start Guide

### 1. Launch Everything in 1 Click (Windows):
Double click **`start-dev.bat`** (or run `.\start-dev.ps1`).

### 2. Manual Terminal Start:

**Backend Server**:
```bash
cd backend
npm install
npm run seed     # Initializes SQLite database and seeds Brightloop demo records
npm start        # Running on http://localhost:5000
```

**Frontend Dev Server**:
```bash
cd frontend
npm install
npm run dev      # Running on http://localhost:3000
```

**Run End-to-End Test Suite**:
```bash
cd backend
npm test         # Executes 27-step automated end-to-end integration test suite
```

---

## 🎬 3-Minute Presentation Demo Script for Judges

1. **The Problem Intro (30s)**:
   - "Brightloop Software was losing money due to spreadsheet tracking, manual invoicing, missed renewals, and unknown MRR."
2. **Admin Command Center & Subscription Intelligence (45s)**:
   - Log in as **Admin**.
   - Show the **Dashboard**: Highlight real-time MRR (₹43,210+), ARR, and the **Subscription Intelligence** banner warning of upcoming renewals and overdue invoices.
   - Show the **Trigger Billing Run** button: Demonstrates automated batch invoicing with duplicate prevention.
3. **Products & Plans with Variants (30s)**:
   - Go to **Products & Plans**. Show `Business Management Software` with the `Odoo Brand Connector` variant adding ₹560.
   - Show Daily, Weekly, Monthly, and Yearly plans with minimum seat rules.
4. **Customer Self-Service Experience (45s)**:
   - Click the **Customer** button in the top Demo Switcher.
   - Show the **Customer Portal**: The customer sees only their subscriptions and bills.
   - Click **Pay Now** on an outstanding invoice: Choose UPI or Credit Card, click **Confirm & Pay**, and watch the invoice instantly turn into `Paid` with a generated transaction receipt.
5. **Closing Impact (30s)**:
   - Return to Admin: MRR and Total Revenue have automatically updated in real-time.
   - "SubscriptIQ turns chaotic manual billing into an automated recurring revenue engine responding in under 10 milliseconds."

