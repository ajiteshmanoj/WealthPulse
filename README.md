# WealthPulse — AI-Powered Wealth Wellness Hub

> **NFC FinTech Innovator's Hackathon 2026 | Schroders Problem Statement**

WealthPulse is a comprehensive wealth wellness platform that goes beyond traditional portfolio tracking. It provides a **Wealth Wellness Score** — a holistic health metric for your finances — combining diversification analysis, liquidity assessment, behavioral resilience, goal alignment, and digital readiness into a single, actionable score.

---

## Key Features

### Investor Dashboard
- **Wealth Wellness Score** — Composite score (0-100) with animated ring visualization and 12-month trend
- **Score Breakdown** — Five sub-scores: Diversification, Liquidity, Behavioral Resilience, Goal Alignment, Digital Readiness
- **Portfolio Overview** — Interactive pie chart across 6 asset classes: Equities, Bonds, Cash, Crypto, Private Assets, Tokenised Assets
- **Holdings Detail** — Filterable table with day changes, yields, liquidity ratings, and tokenisation types
- **Wealth History** — 12-month wealth trajectory with area chart

### AI Recommendations
- Powered by **Claude (Anthropic API)** — personalized 3-point action plan
- Priority-tagged: Urgent / Suggested / Consider
- Falls back to profile-specific hardcoded recommendations when no API key

### Goal Planner
- **Goal Calculator** — Project future wealth with compound growth
- **Monte Carlo Simulation** — 1,000-run probabilistic analysis with P10/P50/P90 outcomes
- **Return Scenarios** — Conservative (4%), Moderate (7%), Aggressive (11%) comparison
- **Expense Analyzer** — Income vs expenses breakdown with savings gap detection
- **Milestone Tracking** — 25%/50%/75%/100% goal progress markers

### Scenario Lab
- **Stress Testing** — Four macro scenarios: Rate Hike, Market Crash, Crypto Rally, SGD Depreciation
- **Custom Magnitude** — Adjustable parameters for each scenario
- **Asset-Level Impact** — Horizontal bar chart showing per-asset-class gains/losses
- **AI Narrative** — Plain-English explanation of scenario impact

### Market Pulse
- **10 macro news items** with sentiment analysis (positive/negative/neutral)
- **Relevance scoring** and affected asset class tagging
- Falls back to rich mock data covering Fed, MAS, crypto, tokenisation, Singapore markets

### Adviser Client Book
- **8 client profiles** with wellness scores (38-89), AUM, risk flags
- **Portfolio allocation bars** — visual breakdown at a glance
- **Goal tracking** — on-track/off-track status per client
- **Risk flags** — automated detection of concentration, volatility, liquidity issues
- Sorted by wellness score (lowest first) for priority attention

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Python FastAPI, Pydantic            |
| Frontend | React 18, Vite, Recharts            |
| AI       | Anthropic Claude API (claude-sonnet-4-20250514) |
| Data     | React Query, Axios                  |
| Routing  | React Router v6                     |
| Icons    | Lucide React                        |

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: copy and fill in API keys
cp .env.example .env

# Start server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Environment Variables (Optional)

| Variable          | Purpose                              |
|-------------------|--------------------------------------|
| `ANTHROPIC_API_KEY` | Enables live AI recommendations     |
| `NEWS_API_KEY`      | Enables live news from NewsAPI.org  |

Both are optional — the app works fully with mock data.

---

## Investor Profiles

| Profile     | Age | Risk     | AUM (SGD) | Wellness | Key Trait               |
|-------------|-----|----------|-----------|----------|-------------------------|
| Alex Tan    | 28  | Aggressive | 185K    | ~58      | High crypto (35%)       |
| Sarah Lim   | 42  | Balanced   | 820K    | ~81      | Well-diversified        |
| David Chen  | 55  | Conservative | 1.24M  | ~67      | Cash-heavy, no tokenised |

---

## Wellness Score Methodology

The Wealth Wellness Score is a weighted composite:

| Sub-Score              | Weight | Key Factors                                       |
|------------------------|--------|---------------------------------------------------|
| Diversification        | 25%    | Single-asset concentration, class balance          |
| Liquidity              | 20%    | Cash ratio, illiquid asset exposure                |
| Behavioral Resilience  | 20%    | Portfolio volatility, crypto concentration         |
| Goal Alignment         | 20%    | Return gap, contribution adequacy, time horizon    |
| Digital Readiness      | 15%    | Digital/tokenised asset allocation (5-20% optimal) |

**Score Labels:**
- 80-100: Excellent — Wealth is in strong health
- 65-79: Good — Minor optimisations recommended
- 50-64: Fair — Attention needed in key areas
- 35-49: At Risk — Significant imbalances detected
- 0-34: Critical — Immediate rebalancing required

---

## API Endpoints

| Method | Endpoint                | Description                         |
|--------|-------------------------|-------------------------------------|
| GET    | `/api/portfolio/{id}`   | Unified portfolio with holdings     |
| GET    | `/api/wellness/{id}`    | Wellness score with sub-scores      |
| GET    | `/api/news`             | Macro news with sentiment           |
| POST   | `/api/scenario`         | Stress-test portfolio               |
| POST   | `/api/ai/recommend`     | AI-powered recommendations          |
| GET    | `/api/clients`          | Adviser client book                 |
| GET    | `/api/goals/{id}`       | Saved goal with progress            |
| POST   | `/api/goals/calculate`  | Full goal projection + Monte Carlo  |
| POST   | `/api/goals/expenses`   | Expense analysis + suggestions      |

---

## Architecture

```
WealthPulse/
├── backend/
│   ├── main.py              # FastAPI app + CORS + routing
│   ├── routers/
│   │   ├── portfolio.py     # Portfolio data
│   │   ├── wellness.py      # Wellness score engine
│   │   ├── news.py          # News feed (API + mock)
│   │   ├── scenarios.py     # Stress testing
│   │   ├── ai.py            # Claude AI recommendations
│   │   └── goals.py         # Goal calculator + Monte Carlo
│   ├── mock_data/
│   │   ├── portfolios.json  # 3 investor profiles
│   │   ├── clients.json     # 8 adviser clients
│   │   └── goals.json       # Goal configurations
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Layout + routing
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GoalsPage.jsx
│   │   │   ├── ScenariosPage.jsx
│   │   │   ├── NewsPage.jsx
│   │   │   └── ClientsPage.jsx
│   │   ├── components/
│   │   │   ├── WellnessScore/
│   │   │   ├── Portfolio/
│   │   │   └── AI/
│   │   └── services/api.js
│   └── package.json
└── README.md
```

---

## Team

Built for the **NFC FinTech Innovator's Hackathon 2026** — Schroders Problem Statement.
>>>>>>> cc037d1 (Initial commit — WealthPulse AI-Powered Wealth Wellness Hub)
