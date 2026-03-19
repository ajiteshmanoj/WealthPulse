# WealthPulse — AI-Powered Wealth Wellness Hub

> **NFC FinTech Innovator's Hackathon 2026 | Schroders Problem Statement**

WealthPulse is a next-generation wealth wellness platform that redefines how investors and wealth advisers understand financial health. Instead of just tracking portfolio returns, WealthPulse introduces a proprietary **Wealth Wellness Score** — a holistic, multi-dimensional health metric that evaluates diversification, liquidity, behavioral resilience, goal alignment, and digital readiness across traditional and emerging asset classes including crypto and tokenised real-world assets.

Built for Singapore-based investors and wealth managers, the platform combines real-time portfolio analytics with **AI-powered recommendations from Claude (Anthropic)**, interactive goal projections, historical crisis simulations, live financial news with AI sentiment analysis, Singapore-specific tax optimization, a what-if portfolio editor with rebalancing plan generation, AI-generated client reports, and an intelligent adviser dashboard.

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
- [Business Model & Market Opportunity](#business-model--market-opportunity)
- [Regulatory Considerations](#regulatory-considerations)

---

## Demo Walkthrough

The app has two perspectives accessible from the sidebar:

### Adviser Flow
1. Open the app → lands on the **Dashboard** (investor view)
2. Click **Client Book** in the sidebar → see all 8 clients ranked by wellness score
3. Each client card shows: wellness score, AUM, allocation bars, goal status, and risk flags
4. Clients at risk (score < 50) are sorted first for priority attention
5. Click **Generate Report** on any client → AI produces a personalised adviser email with findings and recommendations

### Investor Flow
1. Select an investor profile from the bottom of the sidebar (Alex Tan / Sarah Lim / David Chen)
2. **Dashboard** — See total wealth, wellness score ring (click to view methodology modal), performance stats, wealth history chart, score breakdown, asset allocation pie chart, AI recommendations, and full holdings table with 30-day sparkline trends
3. **Goal Planner** — View goal progress, adjust timeline with interactive slider, visualize projected growth and portfolio strategy outcomes in real time
4. **Scenario Lab** — Stress-test the portfolio against custom macro events or 6 real historical financial crises (2008 GFC, COVID-19, Dot-Com, etc.)
5. **Market Pulse** — Browse live financial news from Yahoo Finance, CNBC, MarketWatch, Reuters, and more, with AI-powered sentiment analysis
6. **What-If Editor** — Drag allocation sliders to explore how rebalancing affects your Wellness Score in real time, then generate a full rebalancing execution plan
7. **Tax Optimization** — View SRS tax relief, CPF top-up savings, dividend withholding tax analysis, and IRAS trading income risk assessment

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
- **Click to open Score Methodology Modal** — shows the full formula, all 5 sub-score calculations with explanations, the user's current sub-scores with progress bars, and score range definitions

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

**Schroders Strategy Alignment:**
- 4 compact cards mapping WealthPulse capabilities to Schroders' active digital asset initiatives
- Highlights alignment with MAS Project Guardian, Project BLOOM, tokenised securities, and AI-powered advisory
- Demonstrates understanding of Schroders' Composable Finance vision

**Holdings Detail Table:**
- Tabbed filter: All / Equities / Bonds / Cash / Crypto / Private / Tokenised
- **30-day Sparkline Trends** — Mini inline line charts per holding showing recent price movement (green for up, red for down)
- Fixed column layout with consistent widths across asset classes
- Per-holding columns adapt by asset class:
  - Equities & Crypto: ticker badge, name, 30D trend sparkline, value, allocation %, daily change %
  - Bonds: name, 30D trend sparkline, value, allocation %, yield %
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

**AI-Generated Client Reports:**
- "Generate Report" button per client card
- Claude AI produces a personalised adviser email including:
  - Subject line and greeting
  - Portfolio wellness summary (2-3 sentences)
  - 3 key findings (specific risk flags, allocation issues, goal misalignment)
  - 3 actionable recommendations (with specific SGD amounts and percentages)
  - Closing with call-to-action for follow-up meeting
- Copy-to-clipboard button for easy export to email
- "Live AI" badge when using real Claude responses; realistic fallback reports when no API key is set

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

### 6. What-If Portfolio Editor

Explore how rebalancing your portfolio affects your Wellness Score — in real time.

**Allocation Sliders:**
- 6 sliders (one per asset class) with automatic proportional rebalancing
- When one slider moves up, others scale down proportionally to maintain 100% total
- Total allocation indicator with green/red validation
- Reset button to restore current portfolio allocations

**Score Impact Panel:**
- Side-by-side current vs proposed overall Wellness Score with delta badge
- Per-dimension breakdown (Diversification, Liquidity, Behavioral Resilience, Goal Alignment, Digital Readiness)
- Dual progress bars showing current and proposed scores per dimension
- Color-coded deltas (green for improvement, red for decline)

**Allocation Comparison:**
- Stacked horizontal bars comparing current vs proposed allocation visually
- Color-coded segments per asset class with percentage labels

**Rebalancing Plan Generation:**
- "Generate Rebalancing Plan" button produces a full execution plan
- **Sell steps:** Which asset classes/holdings to reduce, with SGD amounts and per-security breakdown
- **Buy steps:** Which asset classes/holdings to increase, with suggested instruments (e.g., STI ETF, SPY, Singapore Savings Bonds)
- **Summary:** Total sells, total buys, estimated transaction costs (0.5% of trade volume), wellness score delta
- **Execution notes:** Recommended 2-3 day timeline, priority order (sell first, then buy), and asset-class-specific considerations (crypto withdrawal fees, bond T+2 settlement, SGX trading hours, private asset lock-ups, tokenised asset wallet requirements)

**Debounced API Calls:**
- Backend recalculates scores using the same wellness engine as the main dashboard
- 300ms debounce to avoid excessive API calls while dragging sliders
- Portfolio volatility is re-estimated from asset-class-level volatility assumptions

---

### 7. Tax Optimization

Singapore-specific tax optimization based on actual IRAS tax rules and Singapore financial regulations.

**4 tabs:** Tax Savings, Dividend Tax, Holdings P&L, Risk Assessment

#### Tax Savings Tab

**Total Savings Banner:**
- Aggregate annual tax savings across all strategies
- Shows current income tax, marginal rate, and savings as % of tax bill

**SRS Tax Relief Calculator:**
- Maximum contribution: SGD 15,300/year (citizens/PRs)
- Tax savings = contribution × marginal income tax rate
- Effective bonus return percentage (instant return on contribution)
- Years until penalty-free withdrawal (age 62)
- Retirement benefit: only 50% of SRS withdrawals taxed, spread over 10 years

**CPF Cash Top-Up Relief:**
- Self top-up: up to SGD 8,000 to SA/RA
- Family top-up: up to SGD 8,000 for family members
- Combined tax savings at marginal rate
- CPF SA earns 4% p.a. risk-free interest

**Tax-Smart Suggestions:**
- Prioritized recommendations (High / Medium / Low / Info)
- Actionable advice: SRS maximization, CPF top-ups, dividend restructuring, trading risk mitigation

#### Dividend Tax Tab

**Dividend Withholding Tax (WHT) Analysis:**
- Classifies every holding by domicile: SG, US, or Other
- SG dividends: 100% tax-free under one-tier corporate tax system
- US dividends: 30% withholding (Singapore has no US tax treaty)
- Per-holding breakdown: value, yield, annual dividend, WHT rate, tax paid
- Domicile badges and TAX-FREE labels for SG holdings
- Total WHT avoidable by restructuring to SG equivalents

#### Holdings P&L Tab

- Unrealized gains and losses summary with net position
- "No Capital Gains Tax" banner (Singapore does not tax individual capital gains)
- Gains/Losses toggle with full holdings table (name, current value, cost basis, P&L, P&L %, holding period)
- Tax-loss harvesting opportunities (losses > SGD 500) for strategic rebalancing

#### Risk Assessment Tab

**IRAS Trading Income Reclassification Risk:**
- Risk level indicator: Low / Moderate / High
- Flags holdings held under 12 months (short-term)
- Calculates potential tax exposure if IRAS classifies gains as trading income
- Short-term holdings table with holding period and P&L
- IRAS "badges of trade" assessment factors

**Singapore Income Tax Engine:**
- Full YA2024+ bracket calculator (13 brackets from 0% to 24%)
- Per-user marginal rate based on actual income from goal data

| User | Annual Income | Marginal Rate | Total Potential Savings |
|------|--------------|---------------|------------------------|
| Alex Tan | SGD 78,000 | 7% | SGD 2,217 |
| Sarah Lim | SGD 144,000 | 15% | SGD 5,202 |
| David Chen | SGD 180,000 | 18% | SGD 5,634 |

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
| POST   | `/api/ai/client-report` | Generates an AI-powered adviser email report for a specific client. Includes wellness summary, key findings, and actionable recommendations. Uses Claude API with fallback. Body: `{ client_name }` |

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

### What-If Editor

| Method | Endpoint      | Description                           |
|--------|---------------|---------------------------------------|
| POST   | `/api/whatif`  | Simulates allocation changes and returns current vs proposed wellness scores. Body: `{ user_id, allocations: { equities: 35, bonds: 15, ... } }`. Allocations must sum to 100. Uses the same wellness scoring engine as `/api/wellness`. |
| POST   | `/api/whatif/rebalance-plan` | Generates a step-by-step rebalancing execution plan with sell/buy steps, per-holding breakdown, estimated transaction costs, and execution notes. Body: `{ user_id, allocations: { ... } }` |

### Tax Optimization

| Method | Endpoint         | Description                           |
|--------|------------------|---------------------------------------|
| GET    | `/api/tax/{id}`  | Returns comprehensive Singapore tax analysis: SRS tax relief, CPF top-up relief, dividend WHT breakdown per holding, trading income risk assessment, unrealized P&L, tax-loss harvesting opportunities, and actionable suggestions. Uses YA2024+ income tax brackets. |

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
│   │   ├── ai.py                # POST /api/ai/recommend + /api/ai/client-report — Claude API + fallback
│   │   ├── goals.py             # Goal calculator, projections, expense analyzer
│   │   ├── whatif.py            # POST /api/whatif + /api/whatif/rebalance-plan — allocation editor with live score recalculation and execution planning
│   │   └── tax.py               # GET /api/tax/{id} — SG tax optimization (SRS, CPF, WHT, IRAS risk)
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
│   │   │   ├── WhatIfPage.jsx   # Allocation slider editor with real-time score impact
│   │   │   ├── TaxPage.jsx      # 4-tab SG tax optimization (SRS, CPF, WHT, IRAS risk)
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
- **Singapore tax accuracy** — Tax optimization uses actual IRAS YA2024+ brackets (13 tiers, 0–24%), real SRS/CPF limits, and correct US WHT rates (30%, no SG-US treaty)
- **What-if reuses wellness engine** — The allocation editor calls the same sub-score functions as the dashboard, ensuring score consistency across features

---

## Business Model & Market Opportunity

### Target Segments

| Segment | Description | Go-to-Market |
|---------|-------------|--------------|
| **B2B** | Wealth management firms, private banks, family offices | Direct sales to compliance & advisory teams needing holistic client health monitoring |
| **B2B2C** | Adviser platforms (e.g., iFAST, Endowus for Advisers) | White-label integration — advisers use WealthPulse to engage clients with wellness-driven conversations |
| **B2C** | Mass affluent investors (SGD 100K–5M investable) | Freemium consumer app — basic wellness score free, premium features (AI chat, scenario lab, goal projections) via subscription |

### Revenue Model

- **SaaS Licensing (B2B):** ~SGD 200/month per adviser seat. Includes full dashboard, client book, scenario lab, AI recommendations, and white-label branding.
- **API Licensing (Institutions):** Flat + usage-based pricing for banks/platforms embedding the Wellness Score engine, stress-testing API, or AI recommendation service into their own apps.
- **Freemium Consumer Tier (B2C):** Free basic wellness score and portfolio overview. Premium tier (~SGD 15/month) unlocks AI chat, goal projections, scenario lab, and live market pulse.

### Market Sizing (Singapore)

- **TAM:** ~SGD 4 trillion in assets under management across Singapore's wealth management industry (MAS data)
- **SAM:** 3,000+ MAS-licensed financial advisers and ~200 licensed financial advisory firms — primary B2B target
- **SOM:** Capture 5% of adviser market in Year 1 = ~150 seats × SGD 200/month = SGD 360K ARR, scaling with platform integrations

### Competitive Differentiation

| Feature | WealthPulse | Endowus | StashAway | Syfe |
|---------|-------------|---------|-----------|------|
| Multi-dimensional Wellness Score | Yes (5 sub-scores) | No | No | No |
| Traditional + Crypto + Tokenised assets | Yes (6 classes) | Traditional only | Traditional only | Traditional + crypto |
| Behavioral Resilience scoring | Yes | No | No | No |
| Digital Readiness scoring | Yes | No | No | No |
| Historical crisis stress testing | Yes (6 real crises) | No | No | No |
| AI-powered recommendations (Claude) | Yes | No | Basic | No |
| Adviser multi-client dashboard | Yes | No | No | No |
| Live news with AI sentiment | Yes | No | No | No |
| Singapore tax optimization (SRS/CPF/WHT) | Yes | No | No | No |
| What-if allocation editor with live scoring | Yes | No | No | No |

**WealthPulse is the only platform that unifies traditional, private, and tokenised assets under a single multi-dimensional Wellness Score that includes behavioral resilience and digital readiness — dimensions no existing robo-adviser measures.**

---

## Regulatory Considerations

### Not Regulated Financial Advice

WealthPulse provides **financial information and analytics only** — it does NOT constitute regulated financial advice under the MAS Financial Advisers Act (FAA). All AI-generated recommendations are clearly flagged as informational and educational. The platform does not execute trades, manage assets, or make investment decisions on behalf of users.

### Data Privacy (PDPA Compliance)

- Data aggregation is designed to comply with the **Singapore Personal Data Protection Act (PDPA)**
- No raw bank credentials are stored — the platform is designed for integration with **MAS-endorsed open finance APIs** (SGFinDex framework)
- All portfolio data in the current prototype is mock/demo data; production deployment would use encrypted data stores with consent-based access

### Digital Asset Framework

- Tokenised asset tracking aligns with the **MAS Project Guardian** framework for digital asset interoperability
- Crypto asset classification follows MAS guidelines on Digital Payment Token (DPT) services
- The platform tracks but does not custody digital assets

### Tax Information

- Tax optimization features reference **IRAS YA2024+ income tax brackets** and publicly available SRS/CPF relief limits
- All tax figures are estimates — the platform does not file taxes or interact with IRAS systems
- Dividend withholding tax rates reflect the absence of a Singapore-US tax treaty (30% US WHT)
- Users are advised to consult a qualified tax professional for personalised tax guidance

### Disclaimer

> **WealthPulse does not provide regulated financial advice or tax advice. All scores, projections, tax estimates, and recommendations are for informational and educational purposes only. Consult a licensed financial adviser or tax professional before making investment or tax decisions.**

---

## Team PowerMoo (Ajitesh & Fang Ting)

Built for the **NFC FinTech Innovator's Hackathon 2026** - Wealth Wellness Hub Problem Statement.
