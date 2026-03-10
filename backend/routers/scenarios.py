from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os

router = APIRouter(prefix="/api", tags=["scenarios"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_data")

# --- Custom scenarios (magnitude-adjustable) ---
SCENARIO_IMPACTS = {
    "rate_hike": {
        "equities": -0.04, "bonds": -0.06, "cash": 0.01,
        "crypto": -0.08, "private_assets": -0.02, "tokenised_assets": -0.03
    },
    "market_crash": {
        "equities": -0.20, "bonds": 0.03, "cash": 0.0,
        "crypto": -0.35, "private_assets": -0.10, "tokenised_assets": -0.15
    },
    "crypto_rally": {
        "equities": 0.02, "bonds": 0.0, "cash": 0.0,
        "crypto": 0.50, "private_assets": 0.0, "tokenised_assets": 0.20
    },
    "sgd_depreciation": {
        "equities": 0.03, "bonds": -0.02, "cash": -0.05,
        "crypto": 0.05, "private_assets": 0.02, "tokenised_assets": 0.01
    },
}

SCENARIO_NARRATIVES = {
    "rate_hike": "A {magnitude}% interest rate hike would pressure equity valuations and bond prices, while modestly benefiting cash positions. Crypto assets, sensitive to liquidity conditions, would face significant headwinds. Your portfolio's fixed-income and equity holdings would bear the brunt, while tokenised assets may see moderate declines due to their hybrid nature.",
    "market_crash": "A {magnitude}% market crash would severely impact equity and crypto holdings, with crypto experiencing amplified losses due to higher volatility. Bonds would provide a defensive buffer with modest gains. Private assets would see delayed but meaningful markdowns, while cash positions remain stable as a portfolio anchor.",
    "crypto_rally": "A {magnitude}% crypto rally would significantly boost digital asset holdings and positively impact tokenised assets through improved market sentiment. Equities may see modest spillover gains from improved risk appetite, while traditional fixed income remains largely unaffected by crypto market dynamics.",
    "sgd_depreciation": "SGD depreciation of {magnitude}% would benefit foreign-denominated assets including equities and crypto, while eroding the purchasing power of SGD cash holdings. Bond yields may adjust upward to compensate, creating short-term mark-to-market losses. Tokenised assets see mild positive impact from USD-denominated pricing.",
}

# --- Historical crisis scenarios (fixed impacts based on real data) ---
# These are actual peak-to-trough asset class impacts from historical events
HISTORICAL_CRISES = {
    "gfc_2008": {
        "name": "2008 Global Financial Crisis",
        "period": "Sep 2008 – Mar 2009",
        "description": "The collapse of Lehman Brothers triggered a global credit freeze. The S&P 500 fell 57% from peak, global trade collapsed, and governments launched unprecedented bailouts. Singapore's STI dropped 64% from its 2007 peak.",
        "impacts": {
            "equities": -0.55,        # S&P 500 fell ~57%, STI fell ~64%, blended ~55%
            "bonds": 0.05,            # US Treasuries rallied as safe haven, corporate bonds fell
            "cash": 0.0,              # Cash preserved but near-zero rates
            "crypto": 0.0,            # Bitcoin didn't exist yet — no impact
            "private_assets": -0.30,  # PE markdowns ~30%, real estate -20-40%
            "tokenised_assets": 0.0,  # Didn't exist yet
        },
        "duration_months": 18,
        "recovery_years": 4,  # S&P 500 recovered to pre-crisis highs by Mar 2013
    },
    "covid_2020": {
        "name": "COVID-19 Crash",
        "period": "Feb – Mar 2020",
        "description": "The fastest bear market in history as COVID-19 became a global pandemic. The S&P 500 fell 34% in 23 trading days. Central banks responded with massive stimulus — the Fed cut rates to zero and launched unlimited QE. Markets recovered in record time.",
        "impacts": {
            "equities": -0.34,        # S&P 500 fell 34%, STI fell ~30%
            "bonds": 0.08,            # Treasuries rallied sharply, investment grade held up
            "cash": 0.0,              # Safe but rates cut to zero
            "crypto": -0.40,          # Bitcoin crashed from $9K to $5K (-44%), blended ~40%
            "private_assets": -0.15,  # PE markdowns ~15%, delayed impact
            "tokenised_assets": -0.25, # Early-stage tokenised assets fell with crypto sentiment
        },
        "duration_months": 2,
        "recovery_years": 0.5,  # V-shaped recovery, S&P 500 hit new highs by Aug 2020
    },
    "dotcom_2000": {
        "name": "Dot-Com Bubble Burst",
        "period": "Mar 2000 – Oct 2002",
        "description": "The bursting of the internet bubble wiped out $5 trillion in market value. The NASDAQ fell 78% from peak, and the S&P 500 fell 49%. Tech giants like Cisco and Intel lost 80%+ of their value. It took 15 years for the NASDAQ to recover.",
        "impacts": {
            "equities": -0.49,        # S&P 500 fell 49%, NASDAQ fell 78%
            "bonds": 0.15,            # Significant flight to safety, bonds rallied
            "cash": 0.02,             # Positive real returns as rates were still meaningful
            "crypto": 0.0,            # Didn't exist
            "private_assets": -0.25,  # VC/PE heavily exposed to tech, major losses
            "tokenised_assets": 0.0,  # Didn't exist
        },
        "duration_months": 30,
        "recovery_years": 7,  # S&P 500 recovered by Oct 2007
    },
    "euro_debt_2011": {
        "name": "European Debt Crisis",
        "period": "Jul – Nov 2011",
        "description": "Greece, Portugal, and Ireland faced sovereign debt crises, threatening the Eurozone's survival. Bond yields in peripheral Europe spiked above 7%, banks faced massive losses, and the ECB was forced to intervene with emergency measures. The S&P 500 fell 19%.",
        "impacts": {
            "equities": -0.19,        # S&P 500 fell 19%, European indices fell 25-30%
            "bonds": 0.06,            # US Treasuries rallied, European sovereign bonds mixed
            "cash": 0.01,             # Flight to safety benefited USD/SGD cash
            "crypto": -0.10,          # Bitcoin was nascent, small market, ~10% drop
            "private_assets": -0.08,  # Modest markdowns, European PE hit harder
            "tokenised_assets": 0.0,  # Didn't exist
        },
        "duration_months": 5,
        "recovery_years": 1,
    },
    "china_2015": {
        "name": "China Stock Market Crash",
        "period": "Jun – Aug 2015",
        "description": "The Shanghai Composite plunged 43% in 2 months after a massive retail-driven bubble burst. China devalued the yuan, triggering global contagion fears. The S&P 500 fell 12%, and Asian markets were hit hardest. Singapore's STI dropped 20%.",
        "impacts": {
            "equities": -0.20,        # S&P 500 -12%, STI -20%, blended ~20% for Asia-exposed
            "bonds": 0.03,            # Mild flight to safety
            "cash": 0.01,             # SGD strengthened slightly
            "crypto": -0.15,          # Bitcoin fell ~20% amid risk-off
            "private_assets": -0.10,  # Asia PE marked down 10%
            "tokenised_assets": 0.0,  # Didn't exist
        },
        "duration_months": 3,
        "recovery_years": 1,
    },
    "covid_inflation_2022": {
        "name": "2022 Inflation & Rate Shock",
        "period": "Jan – Oct 2022",
        "description": "The Fed raised rates at the fastest pace since the 1980s to combat 9.1% inflation. Both stocks AND bonds fell simultaneously — a rare event that destroyed the traditional 60/40 portfolio. The S&P 500 fell 25%, and Bitcoin crashed 65% from its $69K peak.",
        "impacts": {
            "equities": -0.25,        # S&P 500 fell 25%
            "bonds": -0.13,           # Bloomberg Agg fell 13% — worst bond year ever
            "cash": -0.02,            # Negative real returns due to high inflation
            "crypto": -0.65,          # Bitcoin fell from $69K to $16K
            "private_assets": -0.15,  # PE markdowns, real estate started declining
            "tokenised_assets": -0.40, # DeFi/tokenised assets crashed with crypto
        },
        "duration_months": 10,
        "recovery_years": 1.5,
    },
}


class ScenarioRequest(BaseModel):
    scenario_type: str
    magnitude: float | None = None  # None for historical crises (fixed impacts)
    user_id: str = "alex_tan"


def load_portfolios():
    with open(os.path.join(DATA_DIR, "portfolios.json")) as f:
        return json.load(f)


@router.get("/historical-crises")
async def get_historical_crises():
    """Return list of available historical crisis scenarios."""
    return {
        "crises": [
            {
                "type": key,
                "name": crisis["name"],
                "period": crisis["period"],
                "description": crisis["description"],
                "duration_months": crisis["duration_months"],
                "recovery_years": crisis["recovery_years"],
            }
            for key, crisis in HISTORICAL_CRISES.items()
        ]
    }


@router.post("/scenario")
async def run_scenario(req: ScenarioRequest):
    try:
        is_historical = req.scenario_type in HISTORICAL_CRISES
        is_custom = req.scenario_type in SCENARIO_IMPACTS

        if not is_historical and not is_custom:
            valid = list(SCENARIO_IMPACTS.keys()) + list(HISTORICAL_CRISES.keys())
            raise HTTPException(
                status_code=400,
                detail=f"Unknown scenario type: {req.scenario_type}. Valid: {valid}"
            )

        portfolios = load_portfolios()
        p = portfolios.get(req.user_id, portfolios["alex_tan"])
        holdings = p["holdings"]
        total_before = p["total_wealth"]

        if is_historical:
            crisis = HISTORICAL_CRISES[req.scenario_type]
            impacts = crisis["impacts"]
            magnitude_factor = 1.0  # Historical impacts are absolute
        else:
            impacts = SCENARIO_IMPACTS[req.scenario_type]
            magnitude_factor = req.magnitude / {
                "rate_hike": 1.0,
                "market_crash": 20.0,
                "crypto_rally": 50.0,
                "sgd_depreciation": 5.0,
            }.get(req.scenario_type, 1.0)

        asset_impacts = []
        total_after = 0

        for asset_class, items in holdings.items():
            class_value = sum(item["value"] for item in items)
            change_pct = impacts.get(asset_class, 0) * magnitude_factor
            value_change = class_value * change_pct
            value_after = class_value + value_change
            total_after += value_after

            asset_impacts.append({
                "asset_class": asset_class,
                "change_pct": round(change_pct * 100, 2),
                "value_change": round(value_change),
                "value_before": round(class_value),
                "value_after": round(value_after),
            })

        value_change = total_after - total_before
        value_change_pct = (value_change / total_before * 100) if total_before else 0

        # Estimate wellness impact
        wellness_before = 58
        wellness_impact = round(value_change_pct * 0.3)
        wellness_after = max(0, min(100, wellness_before + wellness_impact))

        if is_historical:
            crisis = HISTORICAL_CRISES[req.scenario_type]
            narrative = (
                f"**{crisis['name']} ({crisis['period']}):** {crisis['description']} "
                f"Applied to your current portfolio, this crisis would have caused a "
                f"**SGD {abs(round(value_change)):,}** loss ({round(value_change_pct, 1)}%). "
                f"The original crisis lasted {crisis['duration_months']} months and markets took "
                f"approximately {crisis['recovery_years']} year{'s' if crisis['recovery_years'] != 1 else ''} to recover."
            )
            result = {
                "scenario": req.scenario_type,
                "magnitude": round(abs(value_change_pct), 1),
                "is_historical": True,
                "crisis_name": crisis["name"],
                "crisis_period": crisis["period"],
                "duration_months": crisis["duration_months"],
                "recovery_years": crisis["recovery_years"],
                "portfolio_before": {"value": round(total_before), "wellness_score": wellness_before},
                "portfolio_after": {"value": round(total_after), "wellness_score": wellness_after},
                "value_change": round(value_change),
                "value_change_pct": round(value_change_pct, 2),
                "wellness_impact": wellness_impact,
                "asset_impacts": asset_impacts,
                "narrative": narrative,
            }
        else:
            narrative = SCENARIO_NARRATIVES.get(req.scenario_type, "").format(magnitude=req.magnitude)
            result = {
                "scenario": req.scenario_type,
                "magnitude": req.magnitude,
                "is_historical": False,
                "portfolio_before": {"value": round(total_before), "wellness_score": wellness_before},
                "portfolio_after": {"value": round(total_after), "wellness_score": wellness_after},
                "value_change": round(value_change),
                "value_change_pct": round(value_change_pct, 2),
                "wellness_impact": wellness_impact,
                "asset_impacts": asset_impacts,
                "narrative": narrative,
            }

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
