# VedaShield AI (वेदशील्ड एआई) · Complete Healthcare PWA

> **"Smart Safety. Expert Care."**  
> Private medical report insights, interactive 3D human anatomy, verified Indian medicine information, and secure WhatsApp summary sharing for families.

---

## 🌟 Executive Summary & Asset Integration

VedaShield AI is a modern, responsive, bilingual (English & Hindi) Healthcare Progressive Web App (PWA) specifically built to empower Indian families to understand complex laboratory reports, monitor biomarker trends over time, inspect affected anatomical structures in real-time 3D, and avoid dangerous drug-drug interactions.

### How the Assets Are Leveraged:
1. **BodyParts3D & Z-Anatomy 3D Assets**:
   - The workspace contains the full DBCLS BodyParts3D repository (2,234 high-resolution `.obj` anatomy meshes) and Z-Anatomy distribution with `TA2.csv` (7,316 international anatomical terms across 8 languages).
   - For web and mobile browser performance, these models are compiled into lightweight, web-optimized `.glb` meshes (`public/models/`): **Body shell, Brain, Heart, Lungs, Liver, Kidneys, Pancreas, Stomach, and Intestines** (~1.7 MB total).
   - Rendered using **Three.js, React Three Fiber (`@react-three/fiber`), and Drei (`@react-three/drei`)**, the viewer enables 60 FPS OrbitControls, translucent layers, raycasting, dynamic organ pulsing, and visual biomarker mapping.

2. **AI Medical Report Scanner & Verification Table**:
   - Supports drag-and-drop or camera uploads of pathology reports (PDF, PNG, JPG, WebP).
   - Powered by **Google Gemini Multimodal Vision API** to accurately parse Indian diagnostic formats (Dr Lal PathLabs, SRL, Apollo, Max, Metropolis, etc.).
   - Features an **Interactive Verification Table** where users review and edit extracted test names, numeric values, units, and reference intervals before saving.
   - Built-in 1-Click Indian Diagnostic Presets: *Metabolic & Lipid Panel*, *Liver Function (LFT)*, and *Complete Blood Count (CBC)*.

3. **Medical Biomarker Rules & Clinical Mapping**:
   - Dynamic evaluation engine (`medicalRules.ts`) mapping laboratory values to clinical reference intervals: **Within Range (Normal)**, **Above Range (High)**, and **Below Range (Low)**.
   - Automated linkage between out-of-range lab tests and corresponding anatomical organ systems.
   - Tailored **"Questions for Your Doctor"** generation to prepare patients for informed consultations.

4. **Indian Medicine & Generic Interaction Library**:
   - Pre-populated repository of 100+ top Indian pharmaceutical brands (Dolo 650, Glycomet, Telma, Pan-D, Augmentin, etc.) paired with generic active ingredients, food timing directions, and therapeutic categories.
   - Drug-drug interaction checker alerting users to severe or moderate conflicts with calm, actionable guidance.

5. **Family Care & Multi-Profiles**:
   - Individual family profiles: **Self, Spouse, Father, Mother, Child, Grandparent, Other**.
   - Tracks individual blood groups, allergies, and chronic conditions.

6. **User-Consented WhatsApp Sharing**:
   - Generates beautifully formatted WhatsApp summary cards with emojis and clear status highlights.
   - Explicit user consent gate prior to opening WhatsApp Web or mobile native sharing.

7. **Dual-Mode Persistence (Offline-First + Supabase Sync)**:
   - Full offline functionality out of the box using LocalStorage / IndexedDB for zero-friction guest testing.
   - Seamless real-time sync with Supabase (PostgreSQL with Row Level Security and private storage).

8. **Cloudflare Workers Backend**:
   - Lightweight Hono server ready for edge deployment via Cloudflare Workers (`wrangler.toml`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling & Icons** | Tailwind CSS, Lucide Icons, Radix UI primitives |
| **3D Human Anatomy** | Three.js, React Three Fiber, Drei, BodyParts3D GLB assets |
| **Data Visualization** | Recharts (Biomarker history and trend lines) |
| **Internationalization** | i18next, react-i18next (English & हिन्दी) |
| **Document OCR & Vision** | Google Gemini Multimodal Vision API, PDF.js, React Dropzone |
| **Cloud Backend** | Hono running on Node.js / Cloudflare Workers |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, Auth, Storage) |
| **Version Control** | Git & GitHub |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### 1. Installation
All dependencies are already installed in `vedashield-ai`. To verify or reinstall:
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(The application works immediately in offline mode with sample reports and simulated AI vision without any API keys required!)*

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Run Backend Server (Optional)
```bash
npm run server
```
Listens on `http://127.0.0.1:3001` for proxying Gemini Vision requests.

### 5. Production Build
```bash
npm run build
```
Generates production-ready, minified static assets in `dist/`.

---

## 📂 Project Directory Structure

```text
vedashield-ai/
├── public/
│   ├── favicon.svg             # VedaShield brand favicon
│   ├── manifest.webmanifest    # Progressive Web App manifest
│   └── models/                 # Web-optimized 3D GLB models
│       ├── body.glb            # Translucent outer human torso/body shell
│       ├── brain.glb           # Brain & neurological center
│       ├── heart.glb           # Cardiovascular center
│       ├── lungs.glb           # Pulmonary & respiratory system
│       ├── liver.glb           # Hepatic metabolic factory
│       ├── kidneys.glb         # Renal filtration system
│       ├── pancreas.glb        # Endocrine & glucose regulation
│       ├── stomach.glb         # Gastric digestive system
│       ├── intestines.glb      # Small & large intestines
│       └── manifest.json       # FMA IDs, triangle counts & hashes
├── server/
│   └── index.js                # Hono server (Node.js & Cloudflare Workers compatible)
├── src/
│   ├── components/
│   │   ├── anatomy/            # Three.js 3D Viewer & Deep Anatomy Modal
│   │   ├── auth/               # Supabase Auth modal & 1-click Guest login
│   │   ├── chat/               # AI Symptom & Report Chat
│   │   ├── dashboard/          # Executive dashboard & Recharts trends
│   │   ├── family/             # Multi-member Family Profile Manager
│   │   ├── insights/           # Plain-language medical insights & doctor questions
│   │   ├── layout/             # Sticky header, language toggle & navigation
│   │   ├── medicine/           # Indian medicine library & interaction checker
│   │   ├── records/            # Historic lab report archive & timeline
│   │   ├── scanner/            # AI OCR document upload & verification table
│   │   ├── settings/           # Account sync, privacy & legal disclaimers
│   │   └── sharing/            # Consented WhatsApp summary generator
│   ├── data/
│   │   ├── anatomyNomenclature.ts # TA2 bilingual anatomical terms
│   │   └── bp3dCatalog.json    # BodyParts3D catalog metadata
│   ├── i18n/                   # Internationalization (English & हिन्दी)
│   ├── services/
│   │   ├── aiInsights.ts       # Educational insights & doctor question generator
│   │   ├── aiScanner.ts        # Gemini Vision OCR & fallback extractor
│   │   ├── medicalRules.ts     # Laboratory reference ranges & organ mappings
│   │   ├── medicineDb.ts       # 100+ Indian medicines & drug interactions
│   │   ├── sampleReports.ts    # 1-Click diagnostic test presets
│   │   ├── storage.ts          # Offline-first storage with Supabase cloud sync
│   │   └── supabaseClient.ts   # Supabase client setup
│   ├── types/                  # Complete TypeScript domain interfaces
│   ├── App.tsx                 # Core application coordinator & router
│   ├── main.tsx                # React DOM mount point
│   └── index.css               # Tailwind CSS & custom styling
├── supabase/
│   └── migrations/             # PostgreSQL database schemas & RLS policies
├── wrangler.toml               # Cloudflare Workers deployment config
├── tailwind.config.js          # Tailwind design tokens & Emerald palette
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## 🔒 Security, Compliance & Medical Disclaimer

- **Informational & Educational Only**: VedaShield AI does not make autonomous clinical diagnoses, prescribe medications, or alter medical dosages.
- **Privacy First**: Health data is stored locally by default. Cloud synchronization with Supabase uses Row Level Security (RLS), restricting access strictly to the authenticated account owner.
- **WhatsApp Consent Gate**: Medical summaries are never transmitted without explicit user review and interactive consent confirmation.
- **Asset Attribution**: Derived 3D mesh assets are attributed to **BodyParts3D (The Database Center for Life Science, CC-BY-SA 2.1 Japan)** and **Z-Anatomy (CC-BY-SA 4.0)** in compliance with their open-access licenses.
