# WealthPulse — AI-Powered Wealth Wellness Hub

> **NFC FinTech Innovator's Hackathon 2026 | Schroders Problem Statement**

WealthPulse is a next-generation wealth wellness platform that redefines how investors and wealth advisers understand financial health. Instead of just tracking portfolio returns, WealthPulse introduces a proprietary **Wealth Wellness Score** — a holistic, multi-dimensional health metric that evaluates diversification, liquidity, behavioral resilience, goal alignment, and digital readiness across traditional and emerging asset classes including crypto and tokenised real-world assets.

Built for Singapore-based investors and wealth managers, the platform combines real-time portfolio analytics with **AI-powered recommendations from Claude (Anthropic)**, Monte Carlo simulations, macro stress testing, and an intelligent adviser dashboard.

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
3. **Goal Planner** — View goal progress, run Monte Carlo projections, analyze expenses
4. **Scenario Lab** — Stress-test the portfolio against 4 macro events with adjustable magnitude
5. **Market Pulse** — Browse 10 macro news items with sentiment tags and affected asset classes

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
- Goal card with name, type, and on-track/off-track status badge
- Visual progress bar showing current savings vs target amount with percentage
- Key metrics: monthly contribution, time horizon, expected return, projected final value

**Projection Tab (Monte Carlo):**
- Runs 1,000 Monte Carlo simulations with normally distributed returns (std dev = 8%)
- **Key Metrics Row:**
  - Monthly required contribution to meet goal
  - Probability of success (% of simulations reaching target)
  - Shortfall or surplus in SGD
  - Required return rate to meet goal with current contributions
- **Monte Carlo Results:**
  - P10 (pessimistic), P50 (median), P90 (optimistic) final wealth values
  - Color-coded cards (red/blue/green)
- **Wealth Projection Chart:**
  - Dual area chart: projected wealth (blue) and total contributions (green)
  - Yellow dashed reference line at target amount
  - Interactive tooltips with SGD values per year
- **Return Scenarios Comparison:**
  - Three cards: Conservative (4%), Moderate (7%), Aggressive (11%)
  - Each shows final value and "Meets Goal" / "Falls Short" badge
  - Green/red background tinting based on outcome
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

Stress-test your portfolio against macro market events.

**Scenario Selection (4 cards):**
- **Interest Rate Hike** — Default +1% | Impact: equities -4%, bonds -6%, crypto -8%
- **Market Crash** — Default -20% | Impact: equities -20%, crypto -35%, bonds +3%
- **Crypto Rally** — Default +50% | Impact: crypto +50%, tokenised +20%, equities +2%
- **SGD Depreciation** — Default -5% | Impact: cash -5%, crypto +5%, equities +3%

**Custom Magnitude Slider:**
- Adjustable numeric input to modify scenario intensity
- Re-run button to recalculate with custom parameters

**Impact Results:**
- **Summary Row:** Portfolio before vs after, total SGD impact, percentage change, wellness score impact
- **Asset Impact Chart:** Horizontal bar chart showing per-asset-class gain/loss percentages
  - Green bars for gains, red bars for losses
  - Tooltips with exact SGD value changes
- **AI Narrative:** Plain-English paragraph explaining the scenario's impact on the specific portfolio composition

---

### 4. Market Pulse

Curated macro news feed with AI-enriched metadata.

**10 News Items covering:**
- Federal Reserve rate decisions
- Singapore MAS monetary policy
- Bitcoin/crypto market movements
- EU tokenisation regulation
- US inflation data
- South China Sea geopolitical risk
- SGD FX movements
- Schroders product launches (tokenised PE fund)
- Singapore REIT market
- Hong Kong crypto regulation

**Per News Item:**
- Headline, source, time ago
- **Sentiment badge** — Positive (green arrow), Negative (red arrow), Neutral (grey)
- **Relevance badge** — High (red), Medium (yellow), Low (blue)
- **Affected asset classes** — Blue tags showing which portfolio segments are impacted
- Summary paragraph

**Live News:** When `NEWS_API_KEY` is set, fetches real business headlines from NewsAPI.org. Otherwise uses rich mock data.

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
| AI         | Anthropic Claude API (claude-sonnet-4-20250514) | Live personalized recommendations    |
| State      | TanStack React Query                        | Server state, caching, auto-refetch  |
| HTTP       | Axios                                       | API communication                    |
| Routing    | React Router v6                             | Client-side navigation               |
| Icons      | Lucide React                                | Consistent icon system               |
| News       | NewsAPI.org (optional)                      | Live business headlines              |

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

# Optional: add API keys for live AI + news
cp .env.example .env
# Edit .env with your keys

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
| `ANTHROPIC_API_KEY` | No       | Enables live Claude AI recommendations   |
| `NEWS_API_KEY`      | No       | Enables live news from NewsAPI.org       |

The app is fully functional without any API keys — all features work with rich mock data.

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
| GET    | `/api/news` | Returns 10 news items with sentiment, relevance, affected asset classes. Uses NewsAPI if key present, else mock data |

### Scenarios

| Method | Endpoint        | Description                           |
|--------|-----------------|---------------------------------------|
| POST   | `/api/scenario` | Stress-tests portfolio against a macro event. Body: `{ scenario_type, magnitude }`. Types: `rate_hike`, `market_crash`, `crypto_rally`, `sgd_depreciation` |

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
| POST   | `/api/goals/calculate` | Runs full goal projection: monthly required, Monte Carlo (1000 sims), P10/P50/P90, milestones, 3 return scenarios |
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
│   │   ├── news.py              # GET /api/news — NewsAPI integration + mock fallback
│   │   ├── scenarios.py         # POST /api/scenario — 4 stress test types
│   │   ├── ai.py                # POST /api/ai/recommend — Claude API + fallback
│   │   └── goals.py             # Goal calculator, Monte Carlo, expense analyzer
│   ├── mock_data/
│   │   ├── portfolios.json      # 3 investor profiles (Alex, Sarah, David)
│   │   ├── clients.json         # 8 adviser clients (Marcus → Aisha)
│   │   └── goals.json           # Goal configs with income + expenses
│   ├── requirements.txt         # fastapi, uvicorn, anthropic, httpx, pydantic, dotenv
│   └── .env.example             # Template for API keys
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # React entry — QueryClient, BrowserRouter
│   │   ├── App.jsx              # Sidebar navigation + route definitions
│   │   ├── App.css              # Layout, sidebar, stat cards, tabs, animations
│   │   ├── index.css            # Design system — colors, cards, badges, buttons, grid
│   │   ├── services/
│   │   │   └── api.js           # Axios client — all 9 API functions
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main investor dashboard (stats + charts + AI + table)
│   │   │   ├── GoalsPage.jsx    # 3-tab goal planner (overview + projection + expenses)
│   │   │   ├── ScenariosPage.jsx # Scenario selector + impact visualization
│   │   │   ├── NewsPage.jsx     # News feed with sentiment + relevance badges
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

---

## Team

Built for the **NFC FinTech Innovator's Hackathon 2026** — Schroders Problem Statement.
