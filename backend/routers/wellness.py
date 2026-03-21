from fastapi import APIRouter, HTTPException
import json
import os

router = APIRouter(prefix="/api", tags=["wellness"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_data")


def load_portfolios():
    with open(os.path.join(DATA_DIR, "portfolios.json")) as f:
        return json.load(f)


def load_goals():
    with open(os.path.join(DATA_DIR, "goals.json")) as f:
        return json.load(f)


def calc_diversification(holdings, total_wealth):
    """
    Diversification score using HHI (Herfindahl-Hirschman Index) as the foundation,
    enhanced with multi-level concentration penalties.

    HHI ranges:
    - 10,000 = fully concentrated (one asset)
    - ~1,667 = perfectly spread across 6 asset classes
    - Lower HHI = better diversification

    We compute HHI at two levels and blend them, then apply threshold penalties.
    """
    if total_wealth <= 0:
        return {"score": 0, "blended_hhi": 10000, "n_classes": 0, "n_holdings": 0}

    # Collect all individual holding values and class totals
    all_values = []
    class_totals = {}
    for asset_class, items in holdings.items():
        class_total = sum(item["value"] for item in items)
        if class_total > 0:
            class_totals[asset_class] = class_total
        for item in items:
            if item["value"] > 0:
                all_values.append(item["value"])

    n_holdings = len(all_values)
    n_classes = len(class_totals)

    if n_holdings == 0:
        return {"score": 0, "blended_hhi": 10000, "n_classes": 0, "n_holdings": 0}

    # --- Level 1: Holding-level HHI ---
    holding_pcts = [(v / total_wealth) * 100 for v in all_values]
    holding_hhi = sum(p ** 2 for p in holding_pcts)

    # --- Level 2: Asset-class-level HHI ---
    class_pcts = [(v / total_wealth) * 100 for v in class_totals.values()]
    class_hhi = sum(p ** 2 for p in class_pcts)

    # --- Blend: 60% holding-level, 40% asset-class-level ---
    # If there's only one holding per class (e.g. What-If simulated), both levels are equivalent
    blended_hhi = (holding_hhi * 0.6) + (class_hhi * 0.4)

    # --- Normalize HHI to 0-100 score ---
    # HHI 1000 or below = score 100, HHI 5000+ = score 0
    hhi_score = max(0, min(100, ((5000 - blended_hhi) / 4000) * 100))

    # --- Apply threshold penalties (existing logic as modifiers) ---
    penalties = 0

    # Single holding concentration penalty
    for v in all_values:
        pct = (v / total_wealth) * 100
        if pct > 30:
            excess = (pct - 30) / 10
            penalties += 20 * excess

    # Single asset class dominance penalty
    for pct in class_pcts:
        if pct > 60:
            penalties += 15

    final_score = max(0, min(100, round(hhi_score - penalties, 1)))

    return {
        "score": final_score,
        "blended_hhi": round(blended_hhi),
        "n_classes": n_classes,
        "n_holdings": n_holdings,
    }


def calc_liquidity(holdings, total_wealth):
    cash_total = sum(item["value"] for item in holdings.get("cash", []))
    cash_ratio = cash_total / total_wealth if total_wealth > 0 else 0

    private_total = sum(item["value"] for item in holdings.get("private_assets", []))
    illiquid_ratio = private_total / total_wealth if total_wealth > 0 else 0

    if cash_ratio < 0.20:
        score = cash_ratio * 500
    else:
        score = 100 - (illiquid_ratio * 80)

    return max(0, min(100, score))


def calc_behavioral_resilience(portfolio_vol_pct, holdings, total_wealth):
    crypto_total = sum(item["value"] for item in holdings.get("crypto", []))
    crypto_pct = crypto_total / total_wealth * 100 if total_wealth > 0 else 0

    volatility_score = 100 - (portfolio_vol_pct * 2)
    concentration_risk = 100 - (crypto_pct * 1.5)

    score = (volatility_score * 0.6) + (concentration_risk * 0.4)
    return max(0, min(100, score))


def calc_goal_alignment(user_id, holdings, total_wealth, time_horizon):
    goals = load_goals()
    if user_id not in goals:
        return 50

    goal = goals[user_id]
    score = 100

    private_total = sum(item["value"] for item in holdings.get("private_assets", []))
    illiquid_pct = private_total / total_wealth * 100 if total_wealth > 0 else 0

    if time_horizon < 5 and illiquid_pct > 5:
        score -= 20

    # Return gap penalty
    projected_return = goal["expected_return_pct"]
    target = goal["target_amount"]
    current = goal["current_savings_toward_goal"]
    monthly = goal["monthly_contribution"]
    years = goal["target_years"]

    # Simple required return calc
    total_future_contributions = monthly * 12 * years
    needed_from_returns = target - current - total_future_contributions
    if current + total_future_contributions > 0:
        required_return = (needed_from_returns / (current + total_future_contributions / 2)) / years * 100
    else:
        required_return = 0

    return_gap = max(0, required_return - projected_return)
    score -= min(40, return_gap * 10)

    # Monthly contribution bonus
    # Simplified: if on track, bonus
    future_value = current
    monthly_rate = projected_return / 100 / 12
    for _ in range(years * 12):
        future_value = future_value * (1 + monthly_rate) + monthly
    if future_value >= target:
        score += 15

    # Expenses / savings gap
    if "monthly_income" in goal and "expenses" in goal:
        total_exp = sum(goal["expenses"].values())
        surplus = goal["monthly_income"] - total_exp
        if surplus < monthly:
            gap_ratio = (monthly - surplus) / monthly if monthly > 0 else 0
            score -= min(30, gap_ratio * 30)

    return max(0, min(100, score))


def calc_digital_readiness(holdings, total_wealth):
    crypto_total = sum(item["value"] for item in holdings.get("crypto", []))
    tokenised_total = sum(item["value"] for item in holdings.get("tokenised_assets", []))
    digital_pct = (crypto_total + tokenised_total) / total_wealth * 100 if total_wealth > 0 else 0

    if 5 <= digital_pct <= 20:
        score = 85 + (digital_pct - 5) * (15 / 15)
    elif digital_pct < 5:
        score = 40 + digital_pct * 4
    elif 20 < digital_pct <= 30:
        score = 80 - (digital_pct - 20) * 1.5
    else:
        score = 50 - (digital_pct - 30) * 0.67
    return max(0, min(100, score))


def get_label(score):
    if score >= 80:
        return "Excellent — Wealth is in strong health", "#10b981"
    elif score >= 65:
        return "Good — Minor optimisations recommended", "#3b82f6"
    elif score >= 50:
        return "Fair — Attention needed in key areas", "#f59e0b"
    elif score >= 35:
        return "At Risk — Significant imbalances detected", "#f97316"
    else:
        return "Critical — Immediate rebalancing required", "#ef4444"


def get_diversification_insight(score, blended_hhi, n_classes, n_holdings):
    """Generate HHI-aware insight text for diversification."""
    hhi = round(blended_hhi)
    if score >= 80:
        return f"Excellent diversification (HHI: {hhi}). Well-spread across {n_classes} asset classes and {n_holdings} holdings."
    elif score >= 60:
        return f"Good diversification (HHI: {hhi}). Consider spreading further across underrepresented asset classes."
    elif score >= 40:
        return f"Fair diversification (HHI: {hhi}). Portfolio shows moderate concentration — consider rebalancing."
    else:
        return f"High concentration risk (HHI: {hhi}). Portfolio is heavily concentrated — diversification needed urgently."


def get_insight(name, score):
    insights = {
        "diversification": {
            "high": "Well-diversified across asset classes and geographies.",
            "mid": "Moderate concentration — consider spreading across more asset classes.",
            "low": "High concentration risk detected. Rebalancing recommended urgently.",
        },
        "liquidity": {
            "high": "Healthy cash buffer for emergencies and opportunities.",
            "mid": "Cash reserves are adequate but could be improved.",
            "low": "Insufficient liquidity — consider increasing cash allocation.",
        },
        "behavioral_resilience": {
            "high": "Portfolio structured to weather market volatility well.",
            "mid": "Some volatile assets may cause stress during downturns.",
            "low": "High-volatility holdings may trigger panic selling in crashes.",
        },
        "goal_alignment": {
            "high": "Investment strategy is well-aligned with your financial goals.",
            "mid": "Minor adjustments needed to stay on track for goals.",
            "low": "Significant gap between current portfolio and goal requirements.",
        },
        "digital_readiness": {
            "high": "Good exposure to digital and tokenised assets.",
            "mid": "Consider exploring tokenised assets for portfolio modernisation.",
            "low": "Portfolio lacks digital asset exposure — or is overexposed.",
        },
    }
    level = "high" if score >= 75 else "mid" if score >= 50 else "low"
    return insights.get(name, {}).get(level, "")


# Pre-computed monthly trend data per user
WELLNESS_TRENDS = {
    "alex_tan": [
        {"month": "2025-04", "score": 52}, {"month": "2025-05", "score": 50},
        {"month": "2025-06", "score": 48}, {"month": "2025-07", "score": 53},
        {"month": "2025-08", "score": 55}, {"month": "2025-09", "score": 51},
        {"month": "2025-10", "score": 54}, {"month": "2025-11", "score": 56},
        {"month": "2025-12", "score": 55}, {"month": "2026-01", "score": 57},
        {"month": "2026-02", "score": 56}, {"month": "2026-03", "score": 58},
    ],
    "sarah_lim": [
        {"month": "2025-04", "score": 76}, {"month": "2025-05", "score": 77},
        {"month": "2025-06", "score": 78}, {"month": "2025-07", "score": 79},
        {"month": "2025-08", "score": 77}, {"month": "2025-09", "score": 78},
        {"month": "2025-10", "score": 80}, {"month": "2025-11", "score": 79},
        {"month": "2025-12", "score": 80}, {"month": "2026-01", "score": 81},
        {"month": "2026-02", "score": 80}, {"month": "2026-03", "score": 81},
    ],
    "david_chen": [
        {"month": "2025-04", "score": 63}, {"month": "2025-05", "score": 64},
        {"month": "2025-06", "score": 65}, {"month": "2025-07", "score": 64},
        {"month": "2025-08", "score": 65}, {"month": "2025-09", "score": 66},
        {"month": "2025-10", "score": 65}, {"month": "2025-11", "score": 66},
        {"month": "2025-12", "score": 66}, {"month": "2026-01", "score": 67},
        {"month": "2026-02", "score": 67}, {"month": "2026-03", "score": 67},
    ],
}


@router.get("/wellness/{user_id}")
async def get_wellness(user_id: str):
    try:
        portfolios = load_portfolios()
        if user_id not in portfolios:
            raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

        p = portfolios[user_id]
        h = p["holdings"]
        tw = p["total_wealth"]

        div_result = calc_diversification(h, tw)
        div_score = div_result["score"]
        liq_score = calc_liquidity(h, tw)
        beh_score = calc_behavioral_resilience(p["portfolio_vol_pct"], h, tw)
        goal_score = calc_goal_alignment(user_id, h, tw, p["time_horizon"])
        dig_score = calc_digital_readiness(h, tw)

        overall = (
            div_score * 0.25
            + liq_score * 0.20
            + beh_score * 0.20
            + goal_score * 0.20
            + dig_score * 0.15
        )
        overall = round(overall)
        label, color = get_label(overall)

        div_insight = get_diversification_insight(
            div_score, div_result["blended_hhi"],
            div_result["n_classes"], div_result["n_holdings"],
        )

        return {
            "user_id": user_id,
            "overall_score": overall,
            "label": label,
            "color": color,
            "sub_scores": {
                "diversification": {
                    "score": round(div_score),
                    "insight": div_insight,
                    "hhi": div_result["blended_hhi"],
                },
                "liquidity": {"score": round(liq_score), "insight": get_insight("liquidity", liq_score)},
                "behavioral_resilience": {"score": round(beh_score), "insight": get_insight("behavioral_resilience", beh_score)},
                "goal_alignment": {"score": round(goal_score), "insight": get_insight("goal_alignment", goal_score)},
                "digital_readiness": {"score": round(dig_score), "insight": get_insight("digital_readiness", dig_score)},
            },
            "last_updated": "2026-03-10T08:00:00Z",
            "trend": WELLNESS_TRENDS.get(user_id, []),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
