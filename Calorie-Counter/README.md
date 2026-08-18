# NaijaCounts — Calorie Counter

AI-powered calorie & macro tracker for Nigerian and West African dishes. Capture a plate, identify every dish via Google Gemini Vision, and look up real nutritional data from the West African Food Composition Table (WAFCT).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) |
| **State Management** | Zustand 5 |
| **AI Vision** | Google Gemini API (server-side pipeline in `backend/`) |
| **Auth** | Firebase Authentication (email/password + Google) |
| **Persistence** | Firebase Cloud Firestore (`userMeals/{uid}`) + localStorage fallback |
| **Nutrition Database** | Local WAFCT JSON + ingredient-to-dish mapping |
| **Linting** | ESLint 10 |
| **Font** | Plus Jakarta Sans / Inter |

---

## Architecture

### Component Tree

```
App.jsx
├── Navbar.jsx                  — Top navigation, auth entry
├── [currentView === 'landing']
│   ├── HeroSection.jsx         — Hero with CTA overlay buttons
│   ├── ProblemSection.jsx      — Problem statement
│   ├── CounterSection.jsx      — Statistics counter
│   ├── DecodedSection.jsx      — How decoding works
│   ├── StreakSection.jsx       — Streak tracking feature
│   └── HowItWorks.jsx          — Step-by-step walkthrough
├── [currentView === 'signup']  → SignUpView.jsx
├── [currentView === 'signin']  → SignInView.jsx
├── [currentView === 'scan']    → ScanView.jsx
├── [currentView === 'result']  → ScanResultView.jsx
└── [currentView === 'dashboard'] → DailyDashboardView.jsx
    └── MealModal.jsx           — Add/edit meal via catalog search or manual entry
```

### State-Driven Routing

The app uses **state-driven routing** (no React Router). The Zustand store holds a `currentView` key that determines which view renders in `App.jsx`:

```js
currentView === 'landing'    → Landing page (public)
currentView === 'signup'     → Registration form
currentView === 'signin'     → Login form
currentView === 'scan'       → Camera / image upload scanner
currentView === 'result'     → Scan result with macro breakdown
currentView === 'dashboard'  → Personal food diary & daily log
```

---

## Data Flow: Image Scan Pipeline

```
User captures/selects image
        │
        ▼
ScanView.jsx — captures frame from camera or reads a file, then compresses
        │ (base64 JPEG, max 768px @ quality 0.7)
        ▼
useBoundStore.analyzeFoodImage()
        │ (POST /api/analyze-plate)
        ▼
FastAPI backend — Gemini vision identifies EVERY distinct dish
        │   Returns JSON array: [{ dishKey, displayName, estimatedGrams }, ...]
        │
        ├─ LangGraph resolution engine maps each dish to FAO/WAFCT data
        │   ├─ dish_ingredients.json → sum individual ingredient nutrients
        │   └─ fao_wafct.json        → direct WAFCT match, fuzzy, then Groq AI
        │
        └─ Response: { dishes, totals, unresolvedDishes, logs } → ScanResultView
```

### Multi-Dish Detection

The prompt instructs Gemini to **never merge dishes**. Swallow + soup = two separate entries, each looked up independently and then combined into a plate total.

### Fallback & Resilience

- Gemini API 503 errors are retried with exponential backoff (1s, 2s, 4s)
- Unmatched dishes are reported to the user (`unresolvedDishes`) but don't block the pipeline
- Images are resized to 768px JPEG 0.7 before upload to cut latency and cost
- Missing API key is detected on the backend before any network call

---

## State Management (Zustand)

`useBoundStore.js` is the single source of truth:

| Slice | State | Description |
|---|---|---|
| **UI** | `currentView`, `waitlistOpen`, `activeFoodTab` | View routing & modals |
| **Auth** | `isAuthenticated`, `user`, `authLoading`, `authError` | Firebase session |
| **Scanner** | `scanLoading`, `scanError`, `capturedImageSrc`, `scannedFoodData` | Scan pipeline state |
| **Food Diary** | `loggedMeals`, `lastCommittedMeal` | Committed meal log + last-scan shortcut |
| **Modifiers** | `selectedQuantity` (plate multiplier) | Portion scaling on scan results |

### Key Methods

- `analyzeFoodImage(base64)` — POSTs the image to the backend pipeline (Gemini → FAO)
- `updateResultModifiers(updates)` — Recalculate calories when portion changes
- `commitScannedMeal()` — Move scan result into `loggedMeals`, navigate to dashboard
- `addManualMeal(name, calories, grams)` / `updateMeal(id, updates)` / `deleteMeal(id)` — Food diary CRUD
- `addAnotherServing()` — Re-log the last committed meal (one-tap second helping)
- `signup(name, email, password)` / `signin(email, password)` / `signinWithGoogle()` / `signout()` — Firebase auth
- `computeStreak(loggedMeals)` — Consecutive-day logging streak (alive while today *or* yesterday is logged)

### Meal Shape & Persistence

Each meal is stored as:

```js
{ id, name, calories, grams, dateKey: 'YYYY-MM-DD', createdAt: ISO, date: 'Today, 1:30 PM' }
```

Every mutation writes to `localStorage` immediately and syncs to the user's
Firestore document (`userMeals/{uid}`) when signed in. If Firestore is
unavailable (rules not deployed, offline), the app silently keeps using
localStorage — nothing breaks.

---

## Authentication Flow

Auth is handled by **Firebase Authentication**:

1. **SignUp** — Creates an email/password account (with name), signs in, routes to dashboard
2. **SignIn** — Firebase sign-in for existing accounts, or **Google** one-tap
3. **SignOut** — Clears session and returns to landing
4. **My Portal button** — Routes signed-in users straight to their dashboard; others to sign-in

Firestore security rules (`firestore.rules`) lock `userMeals/{uid}` so only the
owner can read/write their own diary document. Deploy them with the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

## Nutrition Data Sources

### `src/data/dish_ingredients.json`

Maps dish keys to ingredient lists with gram weights. Each ingredient resolves against the WAFCT for per-100g nutrient values.

**Mapped dishes:** jollof_rice, egusi_soup, pounded_yam, amala, fried_plantain, moin_moin

### `src/data/fao_wafct.json`

The West African Food Composition Table as a flat JSON array of foods. Each entry contains calories, protein, carbs, fat, and fiber per 100g.

### `src/utils/foodCatalog.js`

Client-side searchable catalog for the "Add Meal" picker. Mirrors the backend's
two-tier lookup:

1. **Dish mapping** — `dish_ingredients.json` dish keys are pre-aggregated into
   per-100g profiles (summing each ingredient against WAFCT).
2. **Direct WAFCT match** — falls through to `fao_wafct.json` foods.

Exports `searchFoods(query, limit)`, `getPer100(nameOrKey)`, and
`caloriesForGrams(profile, grams)`.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **State routing over React Router** | Simple app, 6 views, no URL-based requirements needed |
| **Firebase Auth + Firestore, localStorage fallback** | Real accounts and cross-device sync without a custom backend; diary still works offline or if Firestore rules aren't deployed |
| **Per-user single diary doc** | Bootcamp-scale traffic: one small document read/write per mutation, trivially covered by security rules |
| **Local WAFCT JSON** | Zero-latency nutrition lookups; no API calls for food data |
| **Multi-dish prompt** | Accurately represents Nigerian meals (swallow + soup combos) |
| **Dark theme scanner** | Better contrast for camera viewfinder overlay |

---

## Development

```bash
# Install dependencies
npm install

# Start backend + frontend together (uvicorn in background, then Vite)
npm run dev:all

# Or run them separately
npm run dev        # frontend only (Vite proxies /api to localhost:8000)
start-server.cmd   # backend only (from backend/)

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

The Vite dev server proxies `/api/*` requests to `http://localhost:8000`, so the
frontend always talks to a single origin — the same `/api/analyze-plate` URL it
uses in production. The Scan screen pings `/api/health` on load and shows a
"Backend offline" chip (with a Retry button) if the backend isn't running.

### Environment Variables

The frontend needs no `.env` — AI keys live on the backend only (`backend/.env`):
`GEMINI_API_KEY` (vision) and `GROQ_API_KEY` (dish reclassification).

---

## Project Structure

```
Calorie-Counter/
├── index.html
├── vite.config.js              — Vite + React + Tailwind config
├── package.json
├── src/
│   ├── main.jsx                — React DOM entry point
│   ├── App.jsx                 — Root component with state-driven routing
│   ├── index.css               — Tailwind imports + custom animations
│   ├── components/
│   │   ├── Navbar.jsx          — Sticky nav, auth button
│   │   ├── SignUpView.jsx      — Registration form with brand panel
│   │   ├── SignInView.jsx      — Login form with brand panel
│   │   ├── ScanView.jsx        — Camera feed + capture/upload UI
│   │   ├── ScanResultView.jsx  — Scan result with macro breakdown
│   │   ├── DailyDashboardView.jsx — Food diary, day selector, streak, habit tracker
│   │   └── MealModal.jsx       — Add/edit meal (catalog search or manual entry)
│   ├── views/
│   │   ├── HeroSection.jsx     — Landing hero
│   │   ├── ProblemSection.jsx  — Problem intro section
│   │   ├── CounterSection.jsx  — Stats counter
│   │   ├── DecodedSection.jsx  — Decoded food section
│   │   ├── StreakSection.jsx   — Streak tracker section
│   │   └── HowItWorks.jsx      — How it works section
│   ├── store/
│   │   └── useBoundStore.js    — Zustand store (state, auth, scan pipeline, diary)
│   ├── firebase/
│   │   ├── config.js           — Firebase app init
│   │   ├── auth.js             — Email/password + Google auth helpers
│   │   └── firestore.js        — userMeals load/save helpers
│   ├── utils/
│   │   ├── imageCompression.js — Client-side resize to 768px JPEG 0.7 before upload
│   │   └── foodCatalog.js      — Searchable catalog for the manual add-meal picker
│   ├── data/
│   │   ├── fao_wafct.json      — West African Food Composition Table
│   │   └── dish_ingredients.json — Dish-to-ingredient mapping
│   └── constants/
│       └── images.js           — External image URL constants
├── firestore.rules            — Per-user diary document security rules
└── index.html
```

## Backend

FastAPI service in `backend/` — owns the Gemini vision call, the LangGraph dish-resolution engine, and all AI keys. Run it alongside the frontend:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt   # or double-click start-server.cmd after install
start-server.cmd
```

### Deploying to Vercel (production)

The repo deploys as a single Vercel project with one URL: the React build is
served statically and the FastAPI backend runs as a Python function
(`api/index.py`), so `/api/*` requests hit the same domain as the site — no
CORS, no separate backend host, no keep-alive services.

1. **Set env vars in Vercel** (Project → Settings → Environment Variables):
   - `GEMINI_API_KEY` — Google Gemini vision key
   - `GROQ_API_KEY` — Groq key (dish reclassification; optional, degrades gracefully)
2. **Point the frontend at your Firebase project** — `src/firebase/config.js`
   reads the Firebase SDK config from the `VITE_FIREBASE_*` env vars; set them
   in Vercel and locally in a `.env` file (not committed).
3. **Deploy Firestore rules** (once, from the repo root):
   ```bash
   firebase init firestore   # first time only — accept default rules file
   firebase deploy --only firestore:rules
   ```
4. **Deploy** (from the repo root):
   ```bash
   vercel --prod
   ```
   `vercel.json` already configures `rootDirectory: Calorie-Counter`,
   `buildCommand: npm run build`, `outputDirectory: dist`, and a 60s
   `maxDuration` for the Python function.

Notes:
- The Gemini SDK and LangGraph are lazy-imported on first request, keeping
  cold starts ~1–2s after idle (Hobby tier reuses warm instances for a few
  minutes between scans).
- Scans take ~3–10s once warm; Hobby-tier limit is 60s per invocation and
  ~1M invocations/month free.
- API keys live only in Vercel env vars — `backend/.env` is git-ignored.
