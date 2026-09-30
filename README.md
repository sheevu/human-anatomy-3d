# Human Anatomy 3D & VedaShield AI

## 🌟 Copy project (All-In-One Healthcare & 3D Anatomy Suite)

The `Copy project` folder contains the upgraded full-stack healthcare web application featuring:
1. **Secure Authentication & Guest Mode**: Instant access with 1-click Guest login or username/password.
2. **User KYC Verification**: Country & Nationality selection (190+ countries), Document Verification, Emergency Contacts, and consent handling.
3. **Home Landing Scanner**: Instant lab report file upload or direct camera capture (environment/webcam) with support for popular Indian diagnostic labs (Dr Lal PathLabs, Apollo Diagnostics, Metropolis, SRL Diagnostics).
4. **Bilingual AI Chat (English & हिन्दी)**: Dynamic switching between English and Hindi, contextual report advice, and quick clinical prompts.
5. **3D Interactive Organ Anatomy**: Real 3D anatomy with auto-zoom on organ click, glowing red/amber alert highlights on abnormal organs, and comprehensive clinical care drawer (biomarker analysis, recommended cures, dietary dos & don'ts, questions for doctors).
6. **Daily Diabetes Tracker**: Log blood glucose readings with Before food / After food dropdown, auto date and time selection, Recharts area trend graph, and clinical dietary guidance.

### Quick Start for `Copy project`

```bash
cd "Copy project"
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

To build for production:
```bash
cd "Copy project"
npm run build
```

---

## 🚀 Deploying on Vercel

This repository is pre-configured with `vercel.json` for zero-configuration deployment to Vercel with Single Page Application (SPA) client routing:

### Option 1: Via Vercel Web Dashboard (Recommended)
1. Push your repository to GitHub: `https://github.com/sheevu/human-anatomy-3d`.
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **Add New...** -> **Project**.
4. Import `human-anatomy-3d`.
5. In project configuration:
   - **Root Directory**: Select `Copy project` (or leave as root, root `vercel.json` handles building `Copy project`).
   - **Framework Preset**: `Vite`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click **Deploy**.

### Option 2: Via Vercel CLI
```bash
npm install -g vercel
cd "Copy project"
vercel
```

---

## Interactive Anatomy Explorer (Original)

The asset tests check all eleven GLBs for real geometry, coordinate bounds,
manifest hashes where present, retained attribution, and a total size below 3 MB.
No lint configuration is present in this project; TypeScript checking is available.

### Controls

- Drag to orbit; wheel or pinch to zoom; right-drag or two-finger drag to pan.
- Click/tap a mesh or select its name in the structure browser to read details.
- Filter by body system; search names within that system. Eye buttons hide/show
  groups. Search narrows the list without removing anatomical context.
- Focus frames the selected mesh using its actual bounds. Isolate hides the other
  groups; In context restores the current system. Full body restores all groups,
  clears filters/selection, stops rotation and resets the camera.
- Front, back and side presets, zoom buttons, a selected-label toggle and optional
  auto-rotation are available. Body surface opacity is adjustable.
- With the viewport focused: left/right arrows orbit, up/down arrows pan vertically,
  `+`/`-` zoom and `R` resets. Escape clears selection and returns to body framing.
  All structure and toolbar buttons support keyboard navigation.
- Camera transitions respect reduced-motion preferences. Rendering is on demand,
  except while moving or auto-rotating; pixel ratio is capped at 1.5.

### Verified Model Scope and Licensing

The explorer uses only the existing `vedashield-ai/public/models/*.glb` files:
eight organ groups (brain, heart, lungs, liver, stomach, pancreas, kidneys,
intestines), one thoracic skeletal assembly and one major-vessel assembly. The
external body is a non-selectable context layer. Each file contains one merged
mesh: paired organs, individual ribs, chambers, vessels and microscopic anatomy
are **not** separately selectable. The skeletal asset is a chest assembly, not a
full skeleton. No procedural organ substitutes are used when a model fails.

BodyParts3D, copyright The Database Center for Life Science. Existing derived
meshes retain the mirror's CC BY-SA 2.1 Japan terms; see
[attribution](vedashield-ai/public/models/ATTRIBUTION.md) and
[source notice](vedashield-ai/public/models/LICENSE-source.txt).
The [official database license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
currently states CC BY 4.0; this change does not relicense the shipped derivatives.
These meshes were grouped, simplified, transformed and converted to GLB by the
existing project. The explorer does not load the repository's raw OBJ or Z-Anatomy
Blender datasets. Generic reference geometry is not a patient scan or a diagnostic
or surgical atlas; simplified shapes and curated descriptions need specialist
review for formal teaching use.

For complete structure-level interaction, export the raw datasets into licensed,
optimized GLBs preserving separate meshes, stable IDs, anatomical names, sidedness,
system membership and a common coordinate frame. Validate the identifier mapping
and anatomy with a qualified reviewer, then add per-system lazy loading and asset
coverage tests. Merely listing a raw OBJ in the catalogue does not make it a
selectable web model.

### Failure Handling and Hosting

Missing models display a retry notice while available models and text remain
usable. Devices without WebGL can use the text browser. On graphics-context loss,
Retry recreates the canvas; persistent device limitations may prevent 3D rendering.

`npm run build` writes the static frontend to `vedashield-ai/dist`. A static host
must serve `index.html` for `/anatomy` and serve `/models/*` as real binary files
(not an HTML fallback). Vite dev/preview already handle the app route. The existing
`wrangler.toml` names the healthcare backend, whose entry imports Node filesystem
and server APIs; a production Workers deployment is not validated by a frontend
build. No deployment or backend changes are part of this explorer upgrade.

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
