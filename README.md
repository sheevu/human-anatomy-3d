# Human Anatomy 3D & VedaShield AI

A comprehensive 3D human anatomy asset repository and full-stack AI healthcare Progressive Web App (PWA) designed for interactive anatomical exploration, medical report analysis, and family health management.

---

## 📂 Repository Contents

```text
human-anatomy-3d/
├── vedashield-ai/                         # Full-Stack Healthcare Progressive Web App
│   ├── src/                               # React 19 + TypeScript + Three.js application
│   ├── public/models/                     # Web-optimized 3D GLB models (Body, Organs, Skeleton, Vascular)
│   ├── server/                            # Cloudflare Workers / Hono backend
│   └── supabase/                          # PostgreSQL migrations & Row Level Security
│
├── isa_BP3D_4.0_obj_99/                   # BodyParts3D Authentic 3D Mesh Dataset
│   └── 2,234 high-precision .obj files    # Skeletal, circulatory, respiratory, neural & visceral anatomy
│
├── Models-of-human-anatomy/               # Z-Anatomy Open-Access 3D Atlas
│   ├── TA2.csv                            # 7,316 Terminologia Anatomica 2 terms in 8 languages
│   ├── Z-Anatomy/                         # Blender application template (3D anatomical atlas & Startup.blend)
│   ├── Z-Biomechanics/                    # Biomechanics anatomical models (Startup.blend)
│   └── Anatomy-shortcuts.py               # Blender automation tools
│
├── bodyparts3d_partof_parts_list_e.csv    # 1,370 FMA concept IDs mapped to organ structures
├── Anatomy Insights Series.mp4            # Video tutorial: Comprehensive anatomical navigation
└── Mastering Anatomy Insights.mp4         # Video tutorial: Clinical insights & system walk-through

```

---

## 🌟 Key Components

### 1. VedaShield AI (`/vedashield-ai`)
- **Interactive 3D Anatomy**: Three.js, React Three Fiber, and Drei with orbit controls, organ pulsing, and dynamic biomarker highlights.
- **Authentic Anatomical Systems**:
  - `skeleton.glb`: Real 3D rib cage (ribs 1–12 L/R), sternum, clavicles, and thoracic spine extracted from BodyParts3D.
  - `vascular.glb`: Real 3D ascending/descending aorta, vena cava, pulmonary trunk, and carotid arteries.
  - 8 Visceral Organs: Heart, Brain, Lungs, Liver, Kidneys, Pancreas, Stomach, and Intestines.
- **AI Medical Report Scanner**: Google Gemini Multimodal Vision API OCR for Indian laboratory reports (CBC, LFT, KFT, Lipid panels).
- **Interactive Verification Table**: Editable table allowing users to review and correct extracted values before saving.
- **Bilingual Intelligence**: Full English & हिन्दी medical explanations and "Questions for Your Doctor" powered by `i18next`.
- **Indian Medicine Library**: Directory of 100+ common Indian pharmaceuticals with drug-drug interaction alerts.
- **Family Care Multi-Profiles**: Private records for Self, Parents, Spouse, and Children.
- **WhatsApp Summary Sharing**: Formatted health cards with interactive user consent verification.
- **Edge Backend**: Hono server ready for Cloudflare Workers (`wrangler.toml`).
- **Database & Auth**: Supabase PostgreSQL with Row Level Security and offline-first LocalStorage fallback.

### 2. BodyParts3D Raw Meshes (`/isa_BP3D_4.0_obj_99`)
- **2,234 individual Wavefront `.obj` meshes** developed by the Database Center for Life Science (DBCLS), Japan.
- Standardized to the Foundational Model of Anatomy (FMA) ontology.
- Contains all major organ systems: 913 circulatory vessels, 245 skeletal bones, 101 respiratory passages, 63 digestive structures, and 44 neural pathways.

### 3. Z-Anatomy Knowledge Base (`/Models-of-human-anatomy`)
- Complete Terminologia Anatomica 2 database (`TA2.csv`) spanning Latin, English, French, Spanish, Portuguese, Italian, and Parsi.
- Full navigable Blender 3D anatomical atlas.

---

## 🚀 Quick Start for VedaShield AI

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Run the Web Application
```bash
cd vedashield-ai
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
cd vedashield-ai
npm run build
```

---

## 📜 Licenses & Attribution

- **BodyParts3D**: © The Database Center for Life Science (DBCLS), licensed under [Creative Commons Attribution-ShareAlike 2.1 Japan (CC-BY-SA 2.1 JP)](http://creativecommons.org/licenses/by-sa/2.1/jp/) and [CC-BY 4.0 International](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html).
- **Z-Anatomy**: © Gauthier Kervyn & Marcin Zielinski, licensed under [Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA 4.0)](http://creativecommons.org/licenses/by-sa/4.0/).
- **VedaShield AI**: Educational health literacy application code provided under open development terms.
