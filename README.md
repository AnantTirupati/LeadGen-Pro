<div align="center">

# ⚡ LeadGen Pro

### **AI-Powered Local Business Discovery, Lead Intelligence & Sales CRM**

*Turn local business data into high-converting sales pipelines on autopilot.*

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Google Places API](https://img.shields.io/badge/Google%20Places-API-4285F4?style=flat-square&logo=googlemaps)](https://developers.google.com/maps/documentation/places/web-service)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-8E75B2?style=flat-square&logo=googlegemini)](https://ai.google.dev/)
[![Resend](https://img.shields.io/badge/Resend-Email%20Engine-black?style=flat-square&logo=resend)](https://resend.com/)
[![Tests](https://img.shields.io/badge/Tests-44%2F44%20Passing-brightgreen?style=flat-square)]()
[![Design](https://img.shields.io/badge/Design-Neo--Brutalist-ffe17c?style=flat-square&labelColor=171e19)]()

---

</div>

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Workflow](#-architecture--workflow)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database & Supabase Setup](#database--supabase-setup)
  - [Running Locally](#running-locally)
- [API Reference](#-api-reference)
- [Test Suite & Quality Assurance](#-test-suite--quality-assurance)
- [Design System](#-design-system)

---

## 🚀 Overview

**LeadGen Pro** is a modern B2B lead generation and sales outreach platform built for digital agencies, web developers, freelancers, and sales consultants. 

Instead of generic business scraping, LeadGen Pro uses official Google Places data, deep technical signal auditing, deterministic lead scoring, Google Gemini AI personalization, and a CRM pipeline to identify high-value prospects and convert them through cold outreach.

---

## ✨ Key Features

### 1. 🔍 Google Places Business Discovery
- Real-time business lookup across any global location and industry.
- Deduplication and data normalization (ratings, review count, address, contact, Google Maps URLs).
- Website presence and operational status detection.

### 2. ⚡ Technical Intelligence & Website Auditing
- Scrapes and audits business websites for high-impact agency sales opportunities.
- Inspects **SEO** (Meta titles, descriptions, canonicals, H1s), **Mobile UX** (Viewport meta, responsive readiness), **Security** (HTTPS/SSL), **Speed/Performance**, and **Conversion Readiness** (Phone, email, booking links, CTAs, social links).
- Built-in **SSRF protection** against private IP and internal network probing.
- 24-hour intelligent analysis caching in Supabase.

### 3. 🎯 Deterministic 0–100 Lead Scoring
- Mathematical scoring formula balancing business strength (reputation/reviews) against digital opportunity gaps.
- Classifies prospects into four opportunity tiers: `VERY_HIGH`, `HIGH`, `MEDIUM`, and `LOW`.
- Generates transparent, human-readable reasons and recommended agency services.

### 4. 🤖 AI Sales Pitch Assistant
- Powered by **Google Gemini 1.5 Flash** with strict anti-hallucination and prompt injection guardrails.
- Generates hyper-personalized cold outreach emails and proposals based on verified website audit findings.
- In-place editing and pitch history tracking.

### 5. 📊 Lead CRM Pipeline
- Kanban & List pipeline views across 7 lead statuses:
  `NEW` → `CONTACTED` → `REPLIED` → `INTERESTED` → `PROPOSAL_SENT` → `WON` → `LOST`
- Full activity log timeline (status updates, notes, email events, pitch generations).
- Scheduled follow-up reminders with due date tracking.
- One-click CSV lead export.

### 6. ✉️ Cold Outreach & Follow-Up System
- Automated email drafting and sending via **Resend API**.
- Client/server rate limiting & duplicate send prevention.
- Email delivery webhook tracking (`SENT`, `DELIVERED`, `BOUNCED`, `FAILED`).
- Automatic status progression (moves `NEW` leads to `CONTACTED` upon sending).

### 7. 🔐 Supabase Authentication & Route Protection
- Secure Email + Password signup, login, and session persistence via `@supabase/ssr`.
- Server-side route protection middleware for `/dashboard/*`.
- Multi-tenant data isolation: all API endpoints derive `user_id` server-side (never trusting client payloads).
- PostgreSQL Row-Level Security (RLS) policies across all tables.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) + React 19 |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | Vanilla CSS + [Tailwind CSS v4](https://tailwindcss.com/) (Neo-Brutalist Design System) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15, Auth, RLS, Storage) |
| **Discovery API** | [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service) |
| **AI Intelligence** | [Google Gemini 1.5 Flash](https://ai.google.dev/) via `@google/genai` |
| **Email Outreach** | [Resend](https://resend.com/) API + Webhooks |
| **Icons & Fonts** | [Lucide React](https://lucide.dev/), Cabinet Grotesk & Satoshi (Fontshare) |
| **Testing** | Node.js Test Runner (`node:test` + `tsx`) |

---

## 🔄 Architecture & Workflow

```
[ User Search ]
       │
       ▼
[ Google Places API ] ──► Normalized Businesses ──► [ Supabase DB ]
       │
       ▼
[ Website Signal Crawler & Analyzer ] (SSRF Safe)
       │
       ▼
[ Deterministic Lead Scorer (0-100) ] ──► Opportunity Classification
       │
       ▼
[ Save Lead to CRM ] ──► Scoped to Authenticated User (Supabase Auth)
       │
       ▼
[ Gemini AI Cold Pitch Generator ] ──► Grounded Outreach Draft
       │
       ▼
[ Resend Email Engine ] ──► Webhook Tracking (Delivered / Bounced)
       │
       ▼
[ Lead Pipeline Management ] (Won / Lost / Follow-up Tracking)
```

---

## 📁 Project Structure

```
leadgen-pro/
├── app/
│   ├── api/
│   │   ├── analyze/            # Website intelligence & batch analysis endpoints
│   │   ├── health/             # System healthcheck endpoint
│   │   ├── leads/              # Lead CRM CRUD, stats, pitches, contact & email routes
│   │   │   ├── [id]/
│   │   │   │   ├── contact/    # Update lead contact details
│   │   │   │   ├── email/      # Send and track outreach emails
│   │   │   │   ├── follow-up/  # Schedule and manage follow-ups
│   │   │   │   └── pitch/      # AI pitch generation and edits
│   │   │   ├── save/           # Quick lead save endpoint
│   │   │   └── stats/          # CRM pipeline analytics
│   │   ├── search/             # Google Places search endpoint
│   │   └── webhooks/           # Resend email delivery webhooks
│   ├── auth/callback/          # Supabase auth code exchange handler
│   ├── dashboard/              # Protected dashboard pages
│   │   └── leads/              # Lead CRM and detail inspection views
│   ├── login/                  # Neo-Brutalist Login page
│   ├── signup/                 # Neo-Brutalist Signup page
│   ├── globals.css             # Neo-Brutalist design tokens & core styling
│   ├── layout.tsx              # Root HTML layout & fonts
│   └── page.tsx                # Marketing landing page
├── components/
│   ├── dashboard/              # Sidebar, Topbar, SearchPanel, LeadCard, Filters
│   ├── landing/                # Navbar, Hero, SocialProof, Features, Pricing, CTA
│   └── ui/                     # Badges, buttons, modals
├── lib/
│   ├── email/                  # Resend provider, email templates, HTML sanitization
│   ├── google/                 # Google Places API client & normalizer
│   ├── leads/                  # Scoring algorithms & opportunity classifier
│   ├── sales/                  # Gemini AI pitch prompts & generators
│   ├── supabase/               # SSR client, Server client, Auth helpers, CRM queries
│   └── website/                # HTML parser, signal extraction & SSRF protection
├── supabase/
│   └── schema.sql              # Complete PostgreSQL schema, triggers & RLS policies
├── tests/
│   ├── auth.test.ts            # Authentication, error formatting & user isolation tests
│   ├── crm.test.ts             # CRM pipeline, notes, status changes & KPI tests
│   ├── normalize.test.ts       # Google Places normalization & deduplication tests
│   ├── outreach.test.ts        # Email validation, provider abstraction & webhook tests
│   └── phase3.test.ts          # SSRF safety, signal extraction & scoring tests
├── middleware.ts               # Next.js route protection & session refresh
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10+`
- A [Supabase](https://supabase.com/) project (Free tier works perfectly)
- A [Google Cloud Console](https://console.cloud.google.com/) project with **Places API** enabled *(optional for mock mode)*
- A [Google AI Studio](https://aistudio.google.com/) Gemini API Key *(optional, fallback included)*
- A [Resend](https://resend.com/) API Key *(optional, mock provider included)*

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/leadgen-pro.git
   cd leadgen-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

---

### Environment Variables

Copy the example environment configuration:

```bash
cp .env.local.example .env.local
```

Configure your variables in `.env.local`:

```env
# ─── Supabase (Required for Auth & Database) ───
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# ─── Google Places API ───
GOOGLE_MAPS_API_KEY=AIzaSy...
USE_MOCK_PLACES=false

# ─── Google Gemini AI ───
GEMINI_API_KEY=AIzaSy...

# ─── Email Outreach (Resend) ───
RESEND_API_KEY=re_123456789
EMAIL_FROM=LeadGen Pro <onboarding@resend.dev>
EMAIL_REPLY_TO=alex@youragency.com
RESEND_WEBHOOK_SECRET=whsec_...
```

---

### Database & Supabase Setup

1. Open your **Supabase Dashboard** → **SQL Editor**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) in this repo.
3. Paste the contents into the SQL Editor and click **Run**.

This will automatically create:
- `profiles` table (with trigger on `auth.users` signup)
- `businesses`, `searches`, `website_analysis`, `lead_scores`
- `saved_leads`, `sales_pitches`, `lead_activities`, `lead_emails`, `email_events`
- Row Level Security (RLS) policies and performance indexes

---

### Running Locally

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Landing Page: `http://localhost:3000/`
- Sign Up: `http://localhost:3000/signup`
- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`
- CRM Pipeline: `http://localhost:3000/dashboard/leads`

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/search` | Search businesses via Google Places API | No |
| `POST` | `/api/analyze` | Scrape and audit a website for technical signals | No |
| `POST` | `/api/analyze/batch` | Batch analyze multiple discovered businesses | No |
| `GET` | `/api/leads` | Retrieve saved leads for the authenticated user | **Yes** |
| `POST` | `/api/leads` | Save a discovered business to the CRM | **Yes** |
| `GET` | `/api/leads/stats` | Retrieve CRM pipeline conversion KPIs | **Yes** |
| `GET` | `/api/leads/[id]` | Get detailed lead data, pitch history & activity log | **Yes** |
| `PATCH`| `/api/leads/[id]` | Update lead status or internal notes | **Yes** |
| `DELETE`| `/api/leads/[id]` | Remove lead from CRM | **Yes** |
| `POST` | `/api/leads/[id]/pitch` | Generate or save personalized AI sales pitch | **Yes** |
| `POST` | `/api/leads/[id]/email` | Send outreach email via Resend | **Yes** |
| `POST` | `/api/leads/[id]/follow-up` | Schedule a follow-up reminder | **Yes** |
| `POST` | `/api/webhooks/email` | Ingest Resend webhook delivery events | No (Signed) |

---

## 🧪 Test Suite & Quality Assurance

LeadGen Pro includes an automated unit & integration test suite with 44 tests covering all core modules.

Run the test suite:

```bash
npm test
```

### Test Coverage Highlights:
- **Authentication & Security**: Error message translations, user profile structure, multi-tenant CRM data isolation.
- **SSRF Protection**: Private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`), AWS metadata (`169.254.169.254`), and protocol enforcement.
- **Signal Extraction & Scoring**: HTML tokenization, mobile viewport, SEO meta tags, conversion detection, and deterministic 0–100 scoring consistency.
- **AI Prompts & Pitch Generator**: Strict anti-hallucination validation and output schema conformance.
- **Email & Outreach**: HTML escaping, provider switching, webhook verification, and duplicate send debounce.

---

## 🎨 Design System

LeadGen Pro uses a **Neo-Brutalist UI** tailored for high clarity, fast interaction, and bold SaaS presence:

- **Primary Colors**:
  - Yellow: `#ffe17c`
  - Charcoal: `#171e19`
  - Sage: `#b7c6c2`
  - Pure White & Black: `#ffffff` / `#000000`
- **Typography**:
  - Headings: `Cabinet Grotesk` (800 Weight)
  - Body: `Satoshi` & `Inter`
- **Component Style**:
  - `2px` Solid Black Borders
  - `4px` to `8px` Hard Black Shadows
  - Physical button press interactions (`translate(2px, 2px)`)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
