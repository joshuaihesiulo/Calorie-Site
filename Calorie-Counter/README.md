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
| **AI Vision** | Google Gemini API (`@google/generative-ai`) |
| **Nutrition Database** | Local WAFCT JSON + ingredient-to-dish mapping |
| **Linting** | ESLint 10 |
| **Font** | Plus Jakarta Sans / Inter |

---

## Architecture

### Component Tree

```
App.jsx
├── Navbar.jsx                  — Top navigation, Gemini token input, auth entry
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
ScanView.jsx — captures frame from camera or reads file via FileReader
        │ (base64 JPEG)
        ▼
useBoundStore.analyzeFoodImage()
        │
        ├─ Step A — Gemini Vision identifies EVERY distinct dish
        │   Returns JSON array: [{ dishKey, displayName, estimatedGrams }, ...]
        │   Uses exponential-backoff retry (3 attempts) for 503 errors
        │
        ├─ Step B — faoLookup(dishKey) resolves each dish locally
        │   ├─ dish_ingredients.json → sum individual ingredient nutrients
        │   └─ fao_wafct.json        → direct WAFCT match fallback
        │
        └─ Step C — Aggregate totals across all dishes
```

### Multi-Dish Detection

The prompt instructs Gemini to **never merge dishes**. Swallow + soup = two separate entries, each looked up independently and then combined into a plate total.

### Fallback & Resilience

- Gemini API 503 errors are retried with exponential backoff (1s, 2s, 4s)
- Unrecognised dishes are reported to the user but don't block the pipeline
- Missing API key is detected before any network call

---

## State Management (Zustand)

`useBoundStore.js` is the single source of truth:

| Slice | State | Description |
|---|---|---|
| **UI** | `currentView`, `waitlistOpen`, `activeFoodTab` | View routing & modals |
| **Auth** | `isAuthenticated`, `user`, `geminiToken` | Session & credentials |
| **Scanner** | `scanLoading`, `scanError`, `capturedImageSrc`, `scannedFoodData` | Scan pipeline state |
| **Food Diary** | `loggedMeals` | Committed meal log |
| **Modifiers** | `selectedUnitKey`, `selectedQuantity`, `isRawState`, `promptResponses` | Portion & customisation controls |

### Key Methods

- `analyzeFoodImage(base64)` — Full Gemini → FAO pipeline
- `updateResultModifiers(updates)` — Recalculate calories when portion changes
- `commitScannedMeal()` — Move scan result into `loggedMeals`, navigate to dashboard
- `signup(name, email)` / `signin(email)` / `signout()` — LocalStorage-based auth

---

## Authentication Flow

Auth is **client-side only** using `localStorage`:

1. **SignUp** — Stores `{ name, email }` as `naija_user`, sets `naija_token` → navigates to dashboard
2. **SignIn** — Reads stored user, validates email match, sets token
3. **SignOut** — Clears token, returns to landing
4. **My Portal button** — Calls `checkAuth()` to route to signup/signin/dashboard

---

## Nutrition Data Sources

### `src/data/dish_ingredients.json`

Maps dish keys to ingredient lists with gram weights. Each ingredient resolves against the WAFCT for per-100g nutrient values.

**Mapped dishes:** jollof_rice, egusi_soup, pounded_yam, amala, fried_plantain, moin_moin

### `src/data/fao_wafct.json`

The West African Food Composition Table as a flat JSON array of foods. Each entry contains calories, protein, carbs, fat, and fiber per 100g.

### `src/utils/faoLookup.js`

Two-tier lookup:
1. **Dish mapping** — If `dish_ingredients.json` has the key, sum all ingredient nutrients
2. **Direct WAFCT match** — Fall through to `fao_wafct.json` substring search

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **State routing over React Router** | Simple app, 6 views, no URL-based requirements needed |
| **LocalStorage auth** | No backend dependency; purely client-side prototype |
| **Local WAFCT JSON** | Zero-latency nutrition lookups; no API calls for food data |
| **Multi-dish prompt** | Accurately represents Nigerian meals (swallow + soup combos) |
| **Dark theme scanner** | Better contrast for camera viewfinder overlay |

---

## Development

```bash
# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Environment Variables

No `.env` required. The Gemini API key is entered directly in the navbar input field and persisted to `localStorage` under `NaijaCounts_gemini_Token`.

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
│   │   ├── Navbar.jsx          — Sticky nav, Gemini token input, auth button
│   │   ├── SignUpView.jsx      — Registration form with brand panel
│   │   ├── SignInView.jsx      — Login form with brand panel
│   │   ├── ScanView.jsx        — Camera feed + capture/upload UI
│   │   ├── ScanResultView.jsx  — Scan result with macro breakdown
│   │   └── DailyDashboardView.jsx — Food diary, weekly calendar, habit tracker
│   ├── views/
│   │   ├── HeroSection.jsx     — Landing hero
│   │   ├── ProblemSection.jsx  — Problem intro section
│   │   ├── CounterSection.jsx  — Stats counter
│   │   ├── DecodedSection.jsx  — Decoded food section
│   │   ├── StreakSection.jsx   — Streak tracker section
│   │   └── HowItWorks.jsx      — How it works section
│   ├── store/
│   │   └── useBoundStore.js    — Zustand store (state, auth, scan pipeline)
│   ├── utils/
│   │   └── faoLookup.js        — FAO/WAFCT nutrient lookup utility
│   ├── data/
│   │   ├── fao_wafct.json      — West African Food Composition Table
│   │   └── dish_ingredients.json — Dish-to-ingredient mapping
│   └── constants/
│       └── images.js           — External image URL constants
```
