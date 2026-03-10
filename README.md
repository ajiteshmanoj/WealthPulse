# WealthPulse — AI-Powered Wealth Wellness Hub

> **NFC FinTech Innovator's Hackathon 2026 | Schroders Problem Statement**

WealthPulse is a next-generation wealth wellness platform that redefines how investors and wealth advisers understand financial health. Instead of just tracking portfolio returns, WealthPulse introduces a proprietary **Wealth Wellness Score** — a holistic, multi-dimensional health metric that evaluates diversification, liquidity, behavioral resilience, goal alignment, and digital readiness across traditional and emerging asset classes including crypto and tokenised real-world assets.

Built for Singapore-based investors and wealth managers, the platform combines real-time portfolio analytics with **AI-powered recommendations from Claude (Anthropic)**, interactive goal projections, historical crisis simulations, live financial news with AI sentiment analysis, and an intelligent adviser dashboard.

---

## Table of Contents

- [Demo Walkthrough](#demo-walkthrough)
- [Features In Detail](#features-in-detail)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Investor Profiles](#investor-profiles)
- [Wellness Score Methodology](#wellness-score-methodology)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Design Decisions](#design-decisions)

---

## Demo Walkthrough

The app has two perspectives accessible from the sidebar:

### Adviser Flow
1. Open the app → lands on the **Dashboard** (investor view)
2. Click **Client Book** in the sidebar → see all 8 clients ranked by wellness score
3. Each client card shows: wellness score, AUM, allocation bars, goal status, and risk flags
4. Clients at risk (score < 50) are sorted first for priority attention

### Investor Flow
1. Select an investor profile from the bottom of the sidebar (Alex Tan / Sarah Lim / David Chen)
2. **Dashboard** — See total wealth, wellness score ring, performance stats, wealth history chart, score breakdown, asset allocation pie chart, AI recommendations, and full holdings table
3. **Goal Planner** — View goal progress, adjust timeline with interactive slider, visualize projected growth and portfolio strategy outcomes in real time
4. **Scenario Lab** — Stress-test the portfolio against custom macro events or 6 real historical financial crises (2008 GFC, COVID-19, Dot-Com, etc.)
5. **Market Pulse** — Browse live financial news from Yahoo Finance, CNBC, MarketWatch, Reuters, and more, with AI-powered sentiment analysis

---

## Features In Detail

### 1. Investor Dashboard

The main dashboard provides a complete wealth overview at a glance.

**Top Stats Row (4 cards):**
- **Total Wealth** — Current portfolio value in SGD with daily change percentage
- **Wellness Score** — The composite 0-100 score with color-coded label
- **YTD Return** — Year-to-date portfolio performance
- **Monthly Change** — 30-day portfolio performance

**Wealth History Chart:**
- 12-month area chart showing portfolio value trajectory
- Interactive tooltip with exact SGD values per month
- Gradient fill with smooth curve rendering

**Wealth Wellness Score Panel:**
- Animated SVG ring that counts up from 0 to the actual score on load
- Color changes based on score tier (green/blue/yellow/orange/red)
- Descriptive label (e.g., "Fair — Attention needed in key areas")
- Mini 12-month trend sparkline showing score evolution

**Score Breakdown:**
- Five horizontal progress bars, one per sub-score dimension
- Each bar shows: icon, label, weight percentage, numeric score, and color
- Below each bar: a contextual insight sentence explaining what the score means
- Sub-scores:
  - **Diversification (25%)** — Evaluates single-asset concentration and asset class balance
  - **Liquidity (20%)** — Measures cash buffer adequacy and illiquid asset exposure
  - **Behavioral Resilience (20%)** — Assesses portfolio volatility and crypto concentration risk
  - **Goal Alignment (20%)** — Checks return gaps, contribution adequacy, and time horizon fit
  - **Digital Readiness (15%)** — Rates exposure to digital/tokenised assets (5-20% is optimal)

**Asset Allocation:**
- Interactive donut/pie chart with 6 asset classes
- Color-coded legend with SGD values and percentage breakdown
- Asset classes: Equities, Bonds, Cash, Crypto, Private Assets, Tokenised Assets

**AI Recommendations:**
- 3 personalized recommendations powered by Claude (Anthropic API)
- Each recommendation has:
  - **Priority badge** — Urgent (red), Suggested (blue), Consider (purple)
  - **Title** — Short, actionable headline
  - **Description** — 2-3 sentences with specific numbers and rationale
  - **Action type** — rebalance, save, invest, protect, or automate
- When `ANTHROPIC_API_KEY` is set: live AI analysis using full portfolio + wellness + goal context
- When no key: falls back to realistic, profile-specific hardcoded recommendations
- Shows "Live AI" badge when using real Claude responses

**Holdings Detail Table:**
- Tabbed filter: All / Equities / Bonds / Cash / Crypto / Private / Tokenised
- Per-holding columns adapt by asset class:
  - Equities & Crypto: ticker badge, name, value, allocation %, daily change %
  - Bonds: name, value, allocation %, yield %
  - Cash: name, value, allocation %
  - Private Assets: name, value, allocation %, liquidity badge (low/medium)
  - Tokenised Assets: name, value, allocation %, type badge (bond/property/commodity)

---

### 2. Goal Planner

Three tabs: **Overview**, **Projection**, **Expenses**

**Overview Tab:**
- Editable goal fields — target amount, monthly contribution, time horizon, expected return
- Goal card with name, type, and on-track/off-track status badge
- Visual progress bar showing current savings vs target amount with percentage
- Key metrics: monthly contribution, time horizon, expected return, projected final value

**Projection Tab:**
- **Interactive Timeline Slider (1-30 years):**
  - All calculations update in real time as the slider moves
  - No page reload or API calls needed — everything computes client-side instantly

- **"What It Takes to Reach Your Goal" Panel:**
  - **Recommended Monthly Contribution** — The amount needed per month to reach your goal in the selected timeframe, with comparison to your current contribution
  - **Required Annual Return** — The return rate needed if you keep your current savings, with risk-level guidance (conservative/moderate/aggressive/very high risk)

- **Growth Over Time Chart:**
  - Dual area chart that updates dynamically with the slider
  - Blue area = projected growth with returns (compound interest)
  - Green area = total contributions only (what you put in)
  - Yellow dashed line = target amount
  - Interactive tooltips with SGD values per year

- **Portfolio Strategy Comparison ("What If Your Returns Were Different?"):**
  - Three cards computed dynamically from the slider's year value:
    - **Safe & Steady (Bonds)** — 4% p.a.
    - **Balanced Growth (S&P 500)** — 10% p.a.
    - **High Growth (Tech/Crypto)** — 20% p.a.
  - Each shows projected final value and "Reaches Goal" / "Falls Short" status
  - Green/red background tinting based on outcome
  - As the user increases years, compound growth makes more strategies viable

- **Milestones:**
  - Automatically calculated 25%, 50%, 75%, 100% progress markers
  - Shows year reached and SGD value at each milestone

**Expenses Tab:**
- **Metrics Row:** Monthly income, total expenses, monthly surplus, investable surplus
- **Expense Breakdown Bar Chart:**
  - Vertical bars for each category: Housing, Food, Transport, Insurance, Loans, Lifestyle, Others
  - Color-coded bars with tooltips showing amount and % of income
- **Savings Gap Alert:**
  - Red warning card when surplus < required monthly contribution
  - Shows exact SGD shortfall amount
- **Smart Suggestions:**
  - Auto-generated advice based on expense ratios
  - Flags housing > 30% of income, lifestyle > 15%, savings rate < 20%
  - Calculates specific SGD reduction targets

---

### 3. Scenario Lab

Stress-test your portfolio against macro market events — both custom and historical.

**Two modes via tab switcher:**

#### Custom Scenarios
4 adjustable macro events with custom magnitude input:
- **Interest Rate Hike** (amber) — Default +1% | Impact: equities -4%, bonds -6%, crypto -8%
- **Market Crash** (red) — Default -20% | Impact: equities -20%, crypto -35%, bonds +3%
- **Crypto Rally** (purple) — Default +50% | Impact: crypto +50%, tokenised +20%, equities +2%
- **SGD Depreciation** (orange) — Default -5% | Impact: cash -5%, crypto +5%, equities +3%

Each scenario is color-coded with distinct icons. Users can adjust the magnitude and re-run.

#### Historical Crises
6 real-world financial crises with actual market impact data:

| Crisis | Period | S&P 500 | Key Impact | Recovery |
|--------|--------|---------|------------|----------|
| **2008 Global Financial Crisis** | Sep 2008 – Mar 2009 | -57% | Lehman collapse, global credit freeze, STI -64% | ~4 years |
| **COVID-19 Crash** | Feb – Mar 2020 | -34% | Fastest bear market ever (23 trading days), Bitcoin -40% | ~6 months |
| **Dot-Com Bubble Burst** | Mar 2000 – Oct 2002 | -49% | NASDAQ -78%, $5T wiped out, 15yr NASDAQ recovery | ~7 years |
| **European Debt Crisis** | Jul – Nov 2011 | -19% | Greek/Portugal sovereign debt, ECB emergency measures | ~1 year |
| **China Stock Market Crash** | Jun – Aug 2015 | -12% | Shanghai -43%, yuan devaluation, global contagion | ~1 year |
| **2022 Inflation & Rate Shock** | Jan – Oct 2022 | -25% | Fed fastest hikes since 1980s, bonds -13%, BTC -65% | ~1.5 years |

Each crisis card shows:
- Name, period, and full description of what happened
- Duration in months and recovery timeline
- Click to simulate: applies the actual asset-class-level drawdowns to the user's current portfolio

**Impact Results (both modes):**
- **Summary Row:** Portfolio before vs after, total SGD impact, percentage change, wellness score impact
- **Asset Impact Bars:** Custom horizontal bars per asset class with distinct colors
  - Equities (blue), Bonds (green), Cash (amber), Crypto (purple), Private Assets (pink), Tokenised Assets (cyan)
  - Red bars for losses, green bars for gains, "No Impact" label for 0% changes
  - Each bar shows percentage and SGD value
- **Analysis Narrative:** Contextual paragraph explaining the scenario's impact
  - For historical crises: includes original crisis description, SGD loss amount, duration, and recovery timeline

**User-specific:** All scenarios use the currently selected investor profile's actual portfolio data and holdings.

---

### 4. Market Pulse

**Live financial news** aggregated from major sources with AI-powered sentiment analysis.

**Real-Time RSS Feed Sources:**
- Yahoo Finance
- CNBC
- Reuters
- MarketWatch
- Bloomberg
- Financial Times
- The Straits Times
- Nasdaq

**How it works:**
1. Backend fetches RSS feeds from all sources concurrently
2. Articles are deduplicated by headline and sorted by publish date (newest first)
3. Top 15 headlines are sent to **Claude AI** for analysis
4. Claude returns: sentiment (positive/negative/neutral), relevance (high/medium/low for Singapore wealth management), and affected asset classes
5. Results are cached for 5 minutes to avoid excessive API calls

**Per News Item:**
- **Headline** — Clickable link to the original article (opens in new tab with external link icon)
- **Source and time ago** — e.g., "CNBC · 2 hours ago"
- **Sentiment indicator** — Positive (green up arrow), Negative (red down arrow), Neutral (grey dash)
- **Relevance badge** — High (red), Medium (yellow), Low (blue) — rated for Singapore-based wealth management relevance
- **Affected asset classes** — Blue tags (e.g., "equities", "bonds", "crypto") determined by Claude's analysis of each headline
- **Summary** — Article description/summary

**Graceful fallback:** If all RSS feeds fail or no API key is set, rich mock data with 5 pre-written financial news items is displayed.

---

### 5. Adviser Client Book

Portfolio-wide client management view for wealth advisers.

**Summary Stats Row:**
- Total clients (8)
- Total AUM across all clients
- Average wellness score
- Number of at-risk clients (score < 50)

**Client Cards (sorted by wellness, lowest first):**

Each client card displays in a single row:
- **Avatar** with initials, colored by wellness score tier
- **Name, age, risk profile**
- **Wellness score** — Large number with tier color
- **AUM** — Formatted in SGD
- **Portfolio allocation bar** — Stacked horizontal bar showing equities/bonds/cash/crypto/other percentages with color labels
- **Goal status** — Goal name with on-track (green check) or off-track (red warning) badge
- **Risk flags** — Orange warning items (e.g., "Crypto over 40%", "85% in single stock", "No emergency fund")

**8 Clients with Diverse Profiles:**

| Client        | Age | Score | AUM     | Risk Profile  | Key Issue                    |
|---------------|-----|-------|---------|---------------|------------------------------|
| Aisha Malik   | 35  | 38    | $420K   | Moderate      | 85% in single stock (Grab)   |
| Brandon Teo   | 26  | 43    | $180K   | Aggressive    | Crypto over 40%, no emergency fund |
| Christine Ho  | 50  | 48    | $780K   | Balanced      | Poor diversification, goal drift |
| Raj Kumar     | 32  | 54    | $320K   | Aggressive    | Tech over-concentration      |
| Mei Ling Tan  | 58  | 61    | $950K   | Moderate      | Pre-retirement, insufficient liquidity |
| James Lim     | 45  | 67    | $1.2M   | Growth        | High equity + low cash       |
| Priya Nair    | 38  | 78    | $650K   | Balanced      | Slightly under-diversified FI |
| Marcus Wong   | 68  | 89    | $2.8M   | Conservative  | No flags — model portfolio   |

---

## Tech Stack

| Layer      | Technology                                  | Purpose                              |
|------------|---------------------------------------------|--------------------------------------|
| Backend    | Python 3.9+, FastAPI, Pydantic              | REST API, data validation            |
| Frontend   | React 18, Vite                              | SPA with hot module reload           |
| Charts     | Recharts                                    | Area, pie, bar, line visualizations  |
| AI         | Anthropic Claude API (claude-sonnet-4-20250514) | Live recommendations + news sentiment analysis |
| State      | TanStack React Query                        | Server state, caching, auto-refetch  |
| HTTP       | Axios                                       | API communication                    |
| Routing    | React Router v6                             | Client-side navigation               |
| Icons      | Lucide React                                | Consistent icon system               |
| RSS        | feedparser                                  | Real-time financial news aggregation |
| News Sources | Yahoo Finance, CNBC, Reuters, MarketWatch, Bloomberg, FT, Straits Times, Nasdaq | Live financial RSS feeds |

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: add API keys for live AI + news sentiment
cp .env.example .env
# Edit .env with your Anthropic API key

# Start the server
uvicorn main:app --reload --port 8000
```

The API is now live at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the interactive Swagger documentation.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Both servers must be running simultaneously.

### Environment Variables

| Variable            | Required | Purpose                                  |
|---------------------|----------|------------------------------------------|
| `ANTHROPIC_API_KEY` | No       | Enables live Claude AI recommendations and news sentiment analysis |

The app is fully functional without any API keys — all features work with rich mock/fallback data.

---

## Investor Profiles

Three investor personas with distinct risk profiles and portfolio compositions:

### Alex Tan — The Aggressive Young Investor
- **Age:** 28 | **AUM:** SGD 185,000 | **Risk:** Aggressive
- **Allocation:** Equities 35%, Crypto 35%, Private 10%, Cash 8%, Bonds 7%, Tokenised 5%
- **Wellness Score:** ~58 (Fair)
- **Key Issue:** Crypto overexposure (35%) drags behavioral resilience; low cash buffer
- **Goal:** Property purchase — SGD 300K in 5 years, saving SGD 2,000/month at 8% expected return
- **Holdings:** AAPL, NVDA, SEA, GRAB, TSLA, BTC, ETH, SOL, Singapore Savings Bonds, tokenised treasury + real estate

### Sarah Lim — The Balanced Mid-Career Professional
- **Age:** 42 | **AUM:** SGD 820,000 | **Risk:** Balanced
- **Allocation:** Equities 45%, Bonds 25%, Cash 12%, Crypto 8%, Tokenised 5%, Private 5%
- **Wellness Score:** ~81 (Excellent)
- **Key Insight:** Well-diversified across all classes; model portfolio for balanced profile
- **Goal:** Retirement — SGD 2M in 25 years, saving SGD 3,500/month at 7% expected return
- **Holdings:** STI ETF, S&P500 ETF, MSFT, DBS, OCBC, global bonds, BTC/ETH, Schroders fund, tokenised gold

### David Chen — The Conservative Pre-Retiree
- **Age:** 55 | **AUM:** SGD 1,240,000 | **Risk:** Conservative
- **Allocation:** Bonds 40%, Cash 28%, Equities 25%, Private 5%, Crypto 2%, Tokenised 0%
- **Wellness Score:** ~67 (Good)
- **Key Issue:** Cash-heavy (28%) reduces returns; zero tokenised assets hurts digital readiness
- **Goal:** Children's education — SGD 150K in 10 years, saving SGD 800/month at 5% expected return
- **Holdings:** DBS, OCBC, SingTel, Mapletree, CapitaLand, SSBs, Astrea PE Bonds, CPF, BTC only

---

## Wellness Score Methodology

### Formula

The Wealth Wellness Score is a weighted composite of five sub-scores:

```
Overall = Diversification × 0.25 + Liquidity × 0.20 + Behavioral Resilience × 0.20
        + Goal Alignment × 0.20 + Digital Readiness × 0.15
```

### Sub-Score Calculations

**Diversification (25% weight):**
- Start at 100
- If any single holding > 30% of portfolio: -20 per 10% over threshold
- If any single asset class > 60%: -15
- If any single country > 70%: -10
- Floor: 0, Ceiling: 100

**Liquidity (20% weight):**
- Cash ratio = cash / total wealth
- If cash ratio < 20%: score = cash_ratio × 500
- If cash ratio >= 20%: score = 100 - (illiquid_ratio × 80)
- Illiquid ratio = (private equity + real estate) / total wealth

**Behavioral Resilience (20% weight):**
- Volatility score = 100 - (portfolio_volatility% × 2)
- Concentration risk = 100 - (crypto% × 1.5)
- Final = (volatility_score × 0.6) + (concentration_risk × 0.4)

**Goal Alignment (20% weight):**
- Start at 100
- If time horizon < 5 years and illiquid > 5%: -20
- Return gap penalty: (required_return - projected_return) × 10, max -40
- If monthly contribution meets required: +15 bonus
- If savings gap exists: penalty proportional to gap, max -30
- No goal set: defaults to 50

**Digital Readiness (15% weight):**
- Digital % = (crypto + tokenised) / total wealth
- 5-20% allocation: score 85-100 (optimal zone)
- < 5%: score 40-60 (under-exposed)
- 20-30%: score 65-80 (slightly over-exposed)
- > 30%: score 30-50 (high concentration risk)

### Score Labels

| Range   | Label                                        | Color   |
|---------|----------------------------------------------|---------|
| 80-100  | Excellent — Wealth is in strong health       | Green   |
| 65-79   | Good — Minor optimisations recommended       | Blue    |
| 50-64   | Fair — Attention needed in key areas         | Yellow  |
| 35-49   | At Risk — Significant imbalances detected    | Orange  |
| 0-34    | Critical — Immediate rebalancing required    | Red     |

---

## API Reference

Base URL: `http://localhost:8000`

### Portfolio

| Method | Endpoint              | Description                           |
|--------|-----------------------|---------------------------------------|
| GET    | `/api/portfolio/{id}` | Returns unified portfolio with all holdings, performance, and 12-month wealth history |

### Wellness

| Method | Endpoint             | Description                           |
|--------|----------------------|---------------------------------------|
| GET    | `/api/wellness/{id}` | Returns overall wellness score, 5 sub-scores with insights, label, color, and 12-month trend |

### News

| Method | Endpoint    | Description                           |
|--------|-------------|---------------------------------------|
| GET    | `/api/news` | Fetches live RSS feeds from Yahoo Finance, CNBC, Reuters, MarketWatch, Bloomberg, FT, Straits Times, Nasdaq. Claude AI analyzes sentiment, relevance, and affected asset classes. 5-minute cache. Falls back to mock data if feeds fail. |

### Scenarios

| Method | Endpoint                | Description                           |
|--------|-------------------------|---------------------------------------|
| POST   | `/api/scenario`         | Stress-tests portfolio against a macro event or historical crisis. Body: `{ scenario_type, magnitude?, user_id? }`. Custom types: `rate_hike`, `market_crash`, `crypto_rally`, `sgd_depreciation`. Historical: `gfc_2008`, `covid_2020`, `dotcom_2000`, `euro_debt_2011`, `china_2015`, `covid_inflation_2022` |
| GET    | `/api/historical-crises` | Returns list of available historical crisis scenarios with name, period, description, duration, and recovery time |

### AI Recommendations

| Method | Endpoint            | Description                           |
|--------|---------------------|---------------------------------------|
| POST   | `/api/ai/recommend` | Returns 3 AI-powered recommendations. Uses Claude API if key present, else profile-specific hardcoded data. Body: `{ user_id }` |

### Clients

| Method | Endpoint       | Description                           |
|--------|----------------|---------------------------------------|
| GET    | `/api/clients` | Returns 8 adviser clients with wellness scores, AUM, risk flags, portfolio summary, goal status |

### Goals

| Method | Endpoint               | Description                           |
|--------|------------------------|---------------------------------------|
| GET    | `/api/goals/{id}`      | Returns saved goal with current progress and projected final value |
| POST   | `/api/goals/calculate` | Runs full goal projection: monthly required, scenarios, milestones, wealth projection |
| POST   | `/api/goals/expenses`  | Analyzes income vs expenses: surplus, investable amount, savings gap, smart suggestions |

### Utility

| Method | Endpoint   | Description                           |
|--------|------------|---------------------------------------|
| GET    | `/`        | App info and version                  |
| GET    | `/health`  | Health check + API key status         |

---

## Architecture

```
WealthPulse/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, health check, clients endpoint
│   ├── routers/
│   │   ├── portfolio.py         # GET /api/portfolio/{id} — unified portfolio data
│   │   ├── wellness.py          # GET /api/wellness/{id} — scoring engine (5 sub-scores)
│   │   ├── news.py              # GET /api/news — live RSS feeds + Claude sentiment analysis
│   │   ├── scenarios.py         # POST /api/scenario — 4 custom + 6 historical crises
│   │   ├── ai.py                # POST /api/ai/recommend — Claude API + fallback
│   │   └── goals.py             # Goal calculator, projections, expense analyzer
│   ├── mock_data/
│   │   ├── portfolios.json      # 3 investor profiles (Alex, Sarah, David)
│   │   ├── clients.json         # 8 adviser clients (Marcus → Aisha)
│   │   └── goals.json           # Goal configs with income + expenses
│   ├── requirements.txt         # fastapi, uvicorn, anthropic, httpx, pydantic, feedparser
│   └── .env.example             # Template for API keys
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # React entry — QueryClient, BrowserRouter
│   │   ├── App.jsx              # Sidebar navigation + route definitions
│   │   ├── App.css              # Layout, sidebar, stat cards, tabs, animations
│   │   ├── index.css            # Design system — colors, cards, badges, buttons, grid
│   │   ├── services/
│   │   │   └── api.js           # Axios client — all API functions
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main investor dashboard (stats + charts + AI + table)
│   │   │   ├── GoalsPage.jsx    # 3-tab goal planner with interactive slider projections
│   │   │   ├── ScenariosPage.jsx # Custom + historical crisis stress testing
│   │   │   ├── NewsPage.jsx     # Live news feed with AI sentiment analysis
│   │   │   └── ClientsPage.jsx  # Adviser client book with sorted risk view
│   │   └── components/
│   │       ├── WellnessScore/
│   │       │   ├── ScoreRing.jsx     # Animated SVG circular progress ring
│   │       │   └── ScoreBreakdown.jsx # 5 sub-score bars with insights
│   │       ├── Portfolio/
│   │       │   ├── PortfolioSummary.jsx # Interactive donut chart + legend
│   │       │   ├── HoldingsTable.jsx    # Filterable multi-class holdings table
│   │       │   └── WealthChart.jsx      # 12-month area chart
│   │       └── AI/
│   │           └── Recommendations.jsx  # 3 priority-tagged AI recommendation cards
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Design Decisions

- **Dark theme** — Professional fintech aesthetic with glassmorphism and gradient accents
- **No authentication** — Hackathon prototype; profile switching via sidebar for demo flow
- **Mock-first architecture** — Every endpoint works without API keys; live AI/news are progressive enhancements
- **SGD-denominated** — All values in Singapore Dollars, targeting the local market
- **6 asset classes** — Includes crypto and tokenised assets alongside traditional classes, reflecting Schroders' forward-looking stance on digital wealth
- **Wellness over returns** — The core innovation: measuring portfolio health holistically, not just performance
- **Client-side projections** — Goal projections compute instantly via compound interest formulas (no API round-trip), enabling real-time slider interactivity
- **Historical crisis data** — Real peak-to-trough drawdowns from actual market events, not simulated, giving users an authentic stress-test experience
- **Live news with AI enrichment** — RSS feeds provide real headlines; Claude adds the intelligence layer (sentiment, relevance, asset class tagging)
- **User-specific scenarios** — Stress tests apply to the currently selected investor's actual portfolio, not a generic benchmark

---

## Team

Built for the **NFC FinTech Innovator's Hackathon 2026** — Schroders Problem Statement.
