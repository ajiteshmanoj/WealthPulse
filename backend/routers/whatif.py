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


class RebalancePlanRequest(BaseModel):
    user_id: str
    proposed_allocations: dict


# Suggested instruments for asset classes where user has no existing holdings
SUGGESTED_INSTRUMENTS = {
    "equities": [
        {"name": "STI ETF (ES3)", "weight": 0.5},
        {"name": "S&P 500 ETF (SPY)", "weight": 0.5},
    ],
    "bonds": [
        {"name": "Singapore Savings Bonds", "weight": 0.5},
        {"name": "ABF SG Bond Index Fund", "weight": 0.5},
    ],
    "cash": [
        {"name": "DBS Multiplier Account", "weight": 0.6},
        {"name": "Singapore T-Bill (6-month)", "weight": 0.4},
    ],
    "crypto": [
        {"name": "Bitcoin (BTC)", "weight": 0.6},
        {"name": "Ethereum (ETH)", "weight": 0.4},
    ],
    "private_assets": [
        {"name": "Schroders Capital Semi-Liquid Fund", "weight": 0.5},
        {"name": "CapitaLand Ascendas REIT", "weight": 0.5},
    ],
    "tokenised_assets": [
        {"name": "Schroders Tokenised Bond Fund", "weight": 0.5},
        {"name": "Tokenised SGD T-Bill", "weight": 0.5},
    ],
}

ASSET_CLASS_DISPLAY = {
    "equities": "Equities",
    "bonds": "Bonds",
    "cash": "Cash",
    "crypto": "Crypto",
    "private_assets": "Private Assets",
    "tokenised_assets": "Tokenised Assets",
}


def _round_to_50(val):
    """Round to nearest 50."""
    return round(val / 50) * 50


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


@router.post("/whatif/rebalance-plan")
async def rebalance_plan(req: RebalancePlanRequest):
    try:
        portfolios = load_portfolios()
        if req.user_id not in portfolios:
            raise HTTPException(status_code=404, detail=f"User '{req.user_id}' not found")

        # Validate allocations sum to 100
        alloc_sum = sum(req.proposed_allocations.values())
        if abs(alloc_sum - 100) > 0.5:
            raise HTTPException(
                status_code=400,
                detail=f"Allocations must sum to 100 (got {alloc_sum})",
            )

        for cls in req.proposed_allocations:
            if cls not in VALID_CLASSES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unknown asset class '{cls}'. Valid: {sorted(VALID_CLASSES)}",
                )

        p = portfolios[req.user_id]
        h = p["holdings"]
        tw = p["total_wealth"]
        current_allocs = _current_allocations(h, tw)

        # Check if no changes
        has_changes = False
        for cls in VALID_CLASSES:
            curr = current_allocs.get(cls, 0)
            prop = req.proposed_allocations.get(cls, 0)
            if abs(curr - prop) > 0.5:
                has_changes = True
                break

        if not has_changes:
            return {"plan": None, "message": "No changes detected"}

        # Build steps
        sell_steps = []
        buy_steps = []

        for cls in VALID_CLASSES:
            curr_pct = current_allocs.get(cls, 0)
            prop_pct = req.proposed_allocations.get(cls, 0)
            delta_pct = prop_pct - curr_pct

            if abs(delta_pct) < 0.5:
                continue

            amount_sgd = abs(delta_pct) / 100 * tw
            amount_sgd = _round_to_50(amount_sgd)

            if amount_sgd == 0:
                continue

            # Build holdings breakdown
            holdings_breakdown = []
            existing_items = h.get(cls, [])

            if delta_pct < 0:
                # SELL — distribute across existing holdings, largest first
                items_sorted = sorted(existing_items, key=lambda x: x["value"], reverse=True)
                items_total = sum(item["value"] for item in items_sorted)
                remaining = amount_sgd
                for item in items_sorted:
                    if remaining <= 0:
                        break
                    if items_total > 0:
                        proportion = item["value"] / items_total
                        sell_amount = min(remaining, _round_to_50(amount_sgd * proportion))
                        if sell_amount == 0:
                            sell_amount = 50
                        sell_amount = min(sell_amount, remaining)
                    else:
                        sell_amount = remaining
                    holdings_breakdown.append({
                        "name": item["name"],
                        "action": "sell",
                        "amount_sgd": _round_to_50(sell_amount),
                    })
                    remaining -= sell_amount

                # Fix rounding: adjust last item
                bd_total = sum(x["amount_sgd"] for x in holdings_breakdown)
                if holdings_breakdown and bd_total != amount_sgd:
                    holdings_breakdown[-1]["amount_sgd"] += (amount_sgd - bd_total)

                sell_steps.append({
                    "action": "sell",
                    "asset_class": ASSET_CLASS_DISPLAY.get(cls, cls),
                    "current_pct": round(curr_pct),
                    "proposed_pct": round(prop_pct),
                    "delta_pct": round(delta_pct),
                    "amount_sgd": amount_sgd,
                    "holdings_breakdown": holdings_breakdown,
                })

            else:
                # BUY — add to existing holdings or suggest new instruments
                if existing_items:
                    items_sorted = sorted(existing_items, key=lambda x: x["value"], reverse=True)
                    items_total = sum(item["value"] for item in items_sorted)
                    remaining = amount_sgd
                    for item in items_sorted:
                        if remaining <= 0:
                            break
                        if items_total > 0:
                            proportion = item["value"] / items_total
                            buy_amount = min(remaining, _round_to_50(amount_sgd * proportion))
                            if buy_amount == 0:
                                buy_amount = 50
                            buy_amount = min(buy_amount, remaining)
                        else:
                            buy_amount = remaining
                        holdings_breakdown.append({
                            "name": item["name"],
                            "action": "buy",
                            "amount_sgd": _round_to_50(buy_amount),
                        })
                        remaining -= buy_amount
                else:
                    # No existing holdings — suggest instruments
                    suggestions = SUGGESTED_INSTRUMENTS.get(cls, [{"name": f"New {cls} instrument", "weight": 1.0}])
                    remaining = amount_sgd
                    for i, s in enumerate(suggestions):
                        if i == len(suggestions) - 1:
                            buy_amount = remaining
                        else:
                            buy_amount = _round_to_50(amount_sgd * s["weight"])
                            buy_amount = min(buy_amount, remaining)
                        if buy_amount > 0:
                            holdings_breakdown.append({
                                "name": s["name"],
                                "action": "buy",
                                "amount_sgd": _round_to_50(buy_amount),
                            })
                        remaining -= buy_amount

                # Fix rounding
                bd_total = sum(x["amount_sgd"] for x in holdings_breakdown)
                if holdings_breakdown and bd_total != amount_sgd:
                    holdings_breakdown[-1]["amount_sgd"] += (amount_sgd - bd_total)

                buy_steps.append({
                    "action": "buy",
                    "asset_class": ASSET_CLASS_DISPLAY.get(cls, cls),
                    "current_pct": round(curr_pct),
                    "proposed_pct": round(prop_pct),
                    "delta_pct": round(delta_pct),
                    "amount_sgd": amount_sgd,
                    "holdings_breakdown": holdings_breakdown,
                })

        # Sort by largest amount first
        sell_steps.sort(key=lambda x: x["amount_sgd"], reverse=True)
        buy_steps.sort(key=lambda x: x["amount_sgd"], reverse=True)
        steps = sell_steps + buy_steps

        total_sells = sum(s["amount_sgd"] for s in sell_steps)
        total_buys = sum(s["amount_sgd"] for s in buy_steps)
        trade_volume = (total_sells + total_buys) / 2
        estimated_costs = _round_to_50(trade_volume * 0.005) if trade_volume * 0.005 >= 50 else round(trade_volume * 0.005, 2)

        # Compute wellness scores
        from .wellness import calc_goal_alignment
        current_goal = calc_goal_alignment(req.user_id, h, tw, p["time_horizon"])
        current_score, _ = _compute_scores(h, tw, p["portfolio_vol_pct"], current_goal)

        sim_holdings = _build_simulated_holdings(tw, req.proposed_allocations)
        sim_vol = _estimate_vol(req.proposed_allocations)
        proposed_score, _ = _compute_scores(sim_holdings, tw, sim_vol, current_goal)

        # Execution considerations
        considerations = []
        for s in sell_steps:
            if s["asset_class"] == "Crypto":
                considerations.append("Crypto sells may incur exchange withdrawal fees (~0.1%)")
                break
        for s in buy_steps:
            if s["asset_class"] == "Bonds":
                considerations.append("Bond purchases via CDP may have T+2 settlement")
                break
        for s in sell_steps + buy_steps:
            if s["asset_class"] == "Equities":
                considerations.append("Check SGX trading hours for equity orders")
                break
        for s in buy_steps:
            if s["asset_class"] == "Private Assets":
                considerations.append("Private asset funds may have minimum investment amounts and lock-up periods")
                break
        for s in buy_steps:
            if s["asset_class"] == "Tokenised Assets":
                considerations.append("Tokenised assets may require a compatible digital wallet for custody")
                break
        if not considerations:
            considerations.append("Standard brokerage fees apply to all transactions")

        return {
            "plan": {
                "steps": steps,
                "summary": {
                    "total_sells_sgd": total_sells,
                    "total_buys_sgd": total_buys,
                    "estimated_costs_sgd": estimated_costs,
                    "cost_basis": "0.5% of total trade volume",
                    "current_wellness_score": current_score,
                    "proposed_wellness_score": proposed_score,
                    "wellness_delta": proposed_score - current_score,
                },
                "execution_notes": {
                    "timeline": "Recommended execution over 2-3 trading days to minimize market impact",
                    "priority_order": "Execute sells first to free up capital, then proceed with buys",
                    "considerations": considerations,
                },
                "disclaimer": "This rebalancing plan is an informational execution summary based on your selected allocation, not financial advice. It does not constitute a recommendation under the MAS Financial Advisers Act. Consult a licensed financial adviser before making investment decisions.",
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
