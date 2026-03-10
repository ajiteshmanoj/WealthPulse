from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os

from .wellness import calc_diversification, calc_liquidity, calc_behavioral_resilience, calc_digital_readiness, get_label

router = APIRouter(prefix="/api", tags=["whatif"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_data")

# Asset-class level volatility assumptions (annualised, as fraction)
ASSET_CLASS_VOLS = {
    "equities": 0.15,
    "bonds": 0.04,
    "cash": 0.01,
    "crypto": 0.60,
    "private_assets": 0.10,
    "tokenised_assets": 0.20,
}

VALID_CLASSES = set(ASSET_CLASS_VOLS.keys())


class WhatIfRequest(BaseModel):
    user_id: str
    allocations: dict  # e.g. {"equities": 35, "bonds": 15, ...}


def load_portfolios():
    with open(os.path.join(DATA_DIR, "portfolios.json")) as f:
        return json.load(f)


def _current_allocations(holdings, total_wealth):
    """Compute actual allocation percentages from holdings."""
    allocs = {}
    for asset_class in VALID_CLASSES:
        items = holdings.get(asset_class, [])
        class_total = sum(item["value"] for item in items)
        allocs[asset_class] = round(class_total / total_wealth * 100, 2) if total_wealth > 0 else 0.0
    return allocs


def _build_simulated_holdings(total_wealth, allocations):
    """Create a simplified holdings dict with one item per asset class."""
    holdings = {}
    for asset_class in VALID_CLASSES:
        pct = allocations.get(asset_class, 0)
        value = round(total_wealth * pct / 100, 2)
        if value > 0:
            holdings[asset_class] = [{"name": f"Simulated {asset_class}", "value": value}]
        else:
            holdings[asset_class] = []
    return holdings


def _estimate_vol(allocations):
    """Weighted sum of asset-class volatilities (returns percentage)."""
    vol = 0.0
    for cls, pct in allocations.items():
        vol += (pct / 100) * ASSET_CLASS_VOLS.get(cls, 0.10)
    return vol * 100  # convert to percentage points


def _compute_scores(holdings, total_wealth, portfolio_vol_pct, goal_alignment_score):
    div = calc_diversification(holdings, total_wealth)
    liq = calc_liquidity(holdings, total_wealth)
    beh = calc_behavioral_resilience(portfolio_vol_pct, holdings, total_wealth)
    goal = goal_alignment_score  # fixed — allocation changes don't affect goal alignment
    dig = calc_digital_readiness(holdings, total_wealth)

    overall = round(
        div * 0.25 + liq * 0.20 + beh * 0.20 + goal * 0.20 + dig * 0.15
    )

    sub_scores = {
        "diversification": round(div),
        "liquidity": round(liq),
        "behavioral_resilience": round(beh),
        "goal_alignment": round(goal),
        "digital_readiness": round(dig),
    }
    return overall, sub_scores


@router.post("/whatif")
async def whatif(req: WhatIfRequest):
    try:
        portfolios = load_portfolios()
        if req.user_id not in portfolios:
            raise HTTPException(status_code=404, detail=f"User '{req.user_id}' not found")

        # Validate allocations sum to 100
        alloc_sum = sum(req.allocations.values())
        if abs(alloc_sum - 100) > 0.5:
            raise HTTPException(
                status_code=400,
                detail=f"Allocations must sum to 100 (got {alloc_sum})",
            )

        # Validate asset class names
        for cls in req.allocations:
            if cls not in VALID_CLASSES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unknown asset class '{cls}'. Valid: {sorted(VALID_CLASSES)}",
                )

        p = portfolios[req.user_id]
        h = p["holdings"]
        tw = p["total_wealth"]

        # --- Current scores ---
        # We need the current goal_alignment score to keep it fixed
        from .wellness import calc_goal_alignment
        current_goal = calc_goal_alignment(req.user_id, h, tw, p["time_horizon"])

        current_score, current_sub = _compute_scores(h, tw, p["portfolio_vol_pct"], current_goal)
        current_label, current_color = get_label(current_score)

        # --- Simulated scores ---
        sim_holdings = _build_simulated_holdings(tw, req.allocations)
        sim_vol = _estimate_vol(req.allocations)

        new_score, new_sub = _compute_scores(sim_holdings, tw, sim_vol, current_goal)
        new_label, new_color = get_label(new_score)

        return {
            "user_id": req.user_id,
            "total_wealth": tw,
            "current_allocations": _current_allocations(h, tw),
            "proposed_allocations": req.allocations,
            "current_score": current_score,
            "current_sub_scores": current_sub,
            "current_label": current_label,
            "current_color": current_color,
            "new_score": new_score,
            "new_sub_scores": new_sub,
            "new_label": new_label,
            "new_color": new_color,
            "delta": new_score - current_score,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
