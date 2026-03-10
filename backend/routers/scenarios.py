from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os

router = APIRouter(prefix="/api", tags=["scenarios"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_data")

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


class ScenarioRequest(BaseModel):
    scenario_type: str
    magnitude: float


def load_portfolios():
    with open(os.path.join(DATA_DIR, "portfolios.json")) as f:
        return json.load(f)


@router.post("/scenario")
async def run_scenario(req: ScenarioRequest):
    try:
        if req.scenario_type not in SCENARIO_IMPACTS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown scenario type: {req.scenario_type}. Valid: {list(SCENARIO_IMPACTS.keys())}"
            )

        impacts = SCENARIO_IMPACTS[req.scenario_type]
        # Use first portfolio for demo (alex_tan)
        portfolios = load_portfolios()
        p = portfolios["alex_tan"]
        holdings = p["holdings"]
        total_before = p["total_wealth"]

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

        # Estimate wellness impact (simplified)
        wellness_before = 58  # alex_tan's approximate score
        wellness_impact = round(value_change_pct * 0.3)
        wellness_after = max(0, min(100, wellness_before + wellness_impact))

        narrative = SCENARIO_NARRATIVES.get(req.scenario_type, "").format(magnitude=req.magnitude)

        return {
            "scenario": req.scenario_type,
            "magnitude": req.magnitude,
            "portfolio_before": {"value": round(total_before), "wellness_score": wellness_before},
            "portfolio_after": {"value": round(total_after), "wellness_score": wellness_after},
            "value_change": round(value_change),
            "value_change_pct": round(value_change_pct, 2),
            "wellness_impact": wellness_impact,
            "asset_impacts": asset_impacts,
            "narrative": narrative,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
