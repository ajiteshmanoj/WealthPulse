from fastapi import APIRouter, HTTPException
import json
import os
import hashlib

router = APIRouter(prefix="/api", tags=["tax"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_data")


def load_portfolios():
    with open(os.path.join(DATA_DIR, "portfolios.json")) as f:
        return json.load(f)


def _deterministic_seed(name: str) -> float:
    """Return a deterministic float in [-1, 1) based on the holding name."""
    h = hashlib.md5(name.encode()).hexdigest()
    # Use first 8 hex chars -> int -> normalise to [-1, 1)
    val = int(h[:8], 16) / 0xFFFFFFFF  # 0..1
    return val * 2 - 1  # -1..1


def _generate_cost_basis(holding: dict) -> dict:
    """Augment a holding with realistic mock cost-basis data."""
    name = holding.get("name", holding.get("ticker", "unknown"))
    current_value = holding["value"]

    seed = _deterministic_seed(name)

    # Generate a PnL percentage between -25% and +35%
    pnl_pct = round(seed * 30, 2)  # range roughly -30% to +30%

    # cost_basis = value / (1 + pnl_pct/100) so that unrealized_pnl = value - cost_basis
    cost_basis = round(current_value / (1 + pnl_pct / 100), 2)
    unrealized_pnl = round(current_value - cost_basis, 2)
    unrealized_pnl_pct = round(pnl_pct, 2)

    # Deterministic holding period (6-60 months)
    period_seed = int(hashlib.md5((name + "_period").encode()).hexdigest()[:4], 16)
    holding_period_months = 6 + (period_seed % 55)

    # purchase_price: for simplicity, treat it as cost_basis (aggregated lot)
    purchase_price = cost_basis

    return {
        **holding,
        "purchase_price": purchase_price,
        "cost_basis": cost_basis,
        "unrealized_pnl": unrealized_pnl,
        "unrealized_pnl_pct": unrealized_pnl_pct,
        "holding_period_months": holding_period_months,
    }


def _format_sgd(amount: float) -> str:
    """Format a number as SGD string."""
    sign = "-" if amount < 0 else ""
    return f"{sign}SGD {abs(amount):,.2f}"


@router.get("/tax/{user_id}")
async def get_tax_view(user_id: str):
    try:
        portfolios = load_portfolios()
        if user_id not in portfolios:
            raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

        p = portfolios[user_id]
        holdings = p["holdings"]
        currency = p.get("currency", "SGD")

        # Augment every holding with cost-basis data
        enriched_holdings = {}
        all_enriched = []
        for asset_class, items in holdings.items():
            enriched = [_generate_cost_basis(item) for item in items]
            enriched_holdings[asset_class] = enriched
            all_enriched.extend(enriched)

        # Separate gains vs losses
        gains = [h for h in all_enriched if h["unrealized_pnl"] > 0]
        losses = [h for h in all_enriched if h["unrealized_pnl"] < 0]
        flat = [h for h in all_enriched if h["unrealized_pnl"] == 0]

        total_unrealized_gains = round(sum(h["unrealized_pnl"] for h in gains), 2)
        total_unrealized_losses = round(sum(h["unrealized_pnl"] for h in losses), 2)
        net_unrealized_pnl = round(total_unrealized_gains + total_unrealized_losses, 2)

        # Tax-loss harvesting opportunities: losses > SGD 500
        harvest_opportunities = sorted(
            [h for h in losses if abs(h["unrealized_pnl"]) > 500],
            key=lambda h: h["unrealized_pnl"],  # most negative first
        )

        # Generate actionable suggestions
        suggestions = _generate_suggestions(gains, losses, harvest_opportunities, currency)

        return {
            "user_id": user_id,
            "currency": currency,
            "holdings": enriched_holdings,
            "summary": {
                "total_unrealized_gains": total_unrealized_gains,
                "total_unrealized_losses": total_unrealized_losses,
                "net_unrealized_pnl": net_unrealized_pnl,
                "holdings_with_gains": len(gains),
                "holdings_with_losses": len(losses),
                "holdings_flat": len(flat),
            },
            "gains": sorted(gains, key=lambda h: h["unrealized_pnl"], reverse=True),
            "losses": sorted(losses, key=lambda h: h["unrealized_pnl"]),
            "tax_loss_harvesting_opportunities": harvest_opportunities,
            "suggestions": suggestions,
            "regulatory_note": (
                "Singapore does not impose capital gains tax on individuals. "
                "However, tax-loss harvesting insights remain relevant for: "
                "(1) corporate and institutional investors subject to income tax on trading gains, "
                "(2) investors with overseas tax obligations (e.g., US withholding tax), and "
                "(3) all investors who wish to realise losses strategically to rebalance their "
                "portfolio without psychological regret — selling a loser feels easier when framed "
                "as a tax-efficient rebalance."
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _generate_suggestions(gains, losses, harvest_opps, currency):
    suggestions = []

    if not harvest_opps:
        suggestions.append({
            "type": "info",
            "message": (
                "No significant unrealised losses detected for tax-loss harvesting. "
                "Your portfolio is broadly in positive territory."
            ),
        })
        return suggestions

    # Pair losses with gains for offset suggestions
    for loss_h in harvest_opps:
        loss_name = loss_h.get("ticker", loss_h.get("name", "Unknown"))
        loss_amount = abs(loss_h["unrealized_pnl"])

        # Find a gain holding to pair with
        matching_gain = None
        for g in gains:
            if g["unrealized_pnl"] >= loss_amount * 0.5:
                matching_gain = g
                break

        if matching_gain:
            gain_name = matching_gain.get("ticker", matching_gain.get("name", "Unknown"))
            suggestions.append({
                "type": "harvest",
                "message": (
                    f"Sell {loss_name} at an unrealised loss of {_format_sgd(loss_amount)} "
                    f"to offset gains from {gain_name} ({_format_sgd(matching_gain['unrealized_pnl'])} gain). "
                    f"This enables a portfolio rebalance without the psychological cost of realising a loss "
                    f"in isolation."
                ),
                "loss_holding": loss_name,
                "loss_amount": -loss_amount,
                "offset_holding": gain_name,
                "offset_gain": matching_gain["unrealized_pnl"],
            })
        else:
            suggestions.append({
                "type": "harvest",
                "message": (
                    f"Consider selling {loss_name} (unrealised loss: {_format_sgd(loss_amount)}) "
                    f"to crystallise the loss for rebalancing purposes. "
                    f"Re-deploy proceeds into a similar-exposure asset to maintain allocation."
                ),
                "loss_holding": loss_name,
                "loss_amount": -loss_amount,
            })

    # General rebalancing note
    suggestions.append({
        "type": "rebalance",
        "message": (
            "While Singapore individuals are generally exempt from capital gains tax, "
            "harvesting losses is a disciplined rebalancing strategy. Selling underperformers "
            "and reinvesting frees up capital for higher-conviction positions without emotional bias."
        ),
    })

    return suggestions
