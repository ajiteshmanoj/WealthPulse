from fastapi import APIRouter, HTTPException
import json
import os
import hashlib
import math

router = APIRouter(prefix="/api", tags=["tax"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_data")

# ---------------------------------------------------------------------------
# Singapore Income Tax Brackets (YA2024 onwards)
# ---------------------------------------------------------------------------
SG_TAX_BRACKETS = [
    (20000, 0.00),
    (30000, 0.02),
    (40000, 0.035),
    (80000, 0.07),
    (120000, 0.115),
    (160000, 0.15),
    (200000, 0.18),
    (240000, 0.19),
    (280000, 0.195),
    (320000, 0.20),
    (500000, 0.22),
    (1000000, 0.23),
    (float("inf"), 0.24),
]

# SRS contribution cap (citizens / PRs)
SRS_MAX_CONTRIBUTION = 15300
# CPF Cash Top-Up relief cap
CPF_TOPUP_SELF_MAX = 8000
CPF_TOPUP_FAMILY_MAX = 8000

# ---------------------------------------------------------------------------
# Known SG-listed tickers (one-tier tax-exempt dividends)
# ---------------------------------------------------------------------------
SG_TICKERS = {
    "ES3", "D05", "O39", "Z74", "ME8U", "C31", "A17U", "N2IU", "M44U",
    "C38U", "BN4", "U11", "S68", "Y92", "F34", "G13", "H78",
}

# Known dividend yields (annualised %) for realistic mock data
KNOWN_DIVIDEND_YIELDS = {
    # SG stocks
    "D05": 5.5,   # DBS
    "O39": 5.3,   # OCBC
    "Z74": 4.8,   # SingTel
    "ME8U": 5.2,  # Mapletree Industrial Trust
    "C31": 4.5,   # CapitaLand Investment
    "ES3": 3.8,   # STI ETF
    # US stocks
    "AAPL": 0.5,
    "NVDA": 0.03,
    "SE": 0.0,
    "GRAB": 0.0,
    "TSLA": 0.0,
    "MSFT": 0.7,
    "SPY": 1.3,
    # Crypto — no dividends
    "BTC": 0.0,
    "ETH": 0.0,
    "SOL": 0.0,
}

# Bond / fixed income yields are already in portfolio data (yield_pct).
# We treat SG bond interest as non-taxable for individuals.

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _load_json(filename: str):
    with open(os.path.join(DATA_DIR, filename)) as f:
        return json.load(f)


def _deterministic_seed(name: str) -> float:
    h = hashlib.md5(name.encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF * 2 - 1  # -1..1


def _generate_cost_basis(holding: dict) -> dict:
    """Augment a holding with deterministic mock cost-basis data."""
    name = holding.get("name", holding.get("ticker", "unknown"))
    current_value = holding["value"]
    seed = _deterministic_seed(name)
    pnl_pct = round(seed * 30, 2)
    cost_basis = round(current_value / (1 + pnl_pct / 100), 2)
    unrealized_pnl = round(current_value - cost_basis, 2)

    period_seed = int(hashlib.md5((name + "_period").encode()).hexdigest()[:4], 16)
    holding_period_months = 6 + (period_seed % 55)

    return {
        **holding,
        "purchase_price": cost_basis,
        "cost_basis": cost_basis,
        "unrealized_pnl": unrealized_pnl,
        "unrealized_pnl_pct": round(pnl_pct, 2),
        "holding_period_months": holding_period_months,
    }


def _calc_sg_income_tax(taxable_income: float) -> float:
    """Calculate total SG income tax for a given taxable income."""
    tax = 0.0
    prev_cap = 0
    for cap, rate in SG_TAX_BRACKETS:
        bracket_income = min(taxable_income, cap) - prev_cap
        if bracket_income <= 0:
            break
        tax += bracket_income * rate
        prev_cap = cap
    return round(tax, 2)


def _marginal_tax_rate(taxable_income: float) -> float:
    """Return the marginal tax rate (as %) for a given taxable income."""
    prev_cap = 0
    for cap, rate in SG_TAX_BRACKETS:
        if taxable_income <= cap:
            return round(rate * 100, 2)
        prev_cap = cap
    return 24.0  # max


def _get_dividend_yield(holding: dict) -> float:
    """Return annualised dividend yield % for a holding."""
    ticker = holding.get("ticker")
    if ticker and ticker in KNOWN_DIVIDEND_YIELDS:
        return KNOWN_DIVIDEND_YIELDS[ticker]
    # Bonds already have yield_pct
    if "yield_pct" in holding:
        return holding["yield_pct"]
    # For other holdings, no dividend
    return 0.0


def _is_sg_listed(holding: dict) -> bool:
    """Determine if a holding is SG-listed (tax-exempt dividends)."""
    ticker = holding.get("ticker", "")
    if ticker in SG_TICKERS:
        return True
    name = holding.get("name", "").lower()
    sg_keywords = [
        "singapore", "sti etf", "dbs", "ocbc", "singtel", "mapletree",
        "capitaland", "temasek", "sgd", "cpf", "abf sg", "ssb",
        "stashaway", "syfe", "endowus", "nikko am sgd",
        "singapore savings bond", "singapore t-bill", "t-bill",
    ]
    return any(kw in name for kw in sg_keywords)


def _domicile(holding: dict, asset_class: str) -> str:
    """Classify domicile: 'SG', 'US', or 'Other'."""
    if asset_class in ("cash", "private_assets"):
        return "SG"
    if asset_class == "crypto":
        return "Other"
    if asset_class == "tokenised_assets":
        return "Other"
    if _is_sg_listed(holding):
        return "SG"
    ticker = holding.get("ticker", "")
    # US tickers are typically all-alpha, 1-5 chars
    if ticker and ticker.isalpha() and len(ticker) <= 5:
        return "US"
    return "Other"


def _format_sgd(amount: float) -> str:
    sign = "-" if amount < 0 else ""
    return f"{sign}SGD {abs(amount):,.0f}"


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------

@router.get("/tax/{user_id}")
async def get_tax_view(user_id: str):
    try:
        portfolios = _load_json("portfolios.json")
        goals = _load_json("goals.json")

        if user_id not in portfolios:
            raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

        p = portfolios[user_id]
        goal = goals.get(user_id, {})
        holdings = p["holdings"]
        currency = p.get("currency", "SGD")
        age = p.get("age", 30)

        # Income & tax rate
        monthly_income = goal.get("monthly_income", 8000)
        annual_income = monthly_income * 12
        marginal_rate = _marginal_tax_rate(annual_income)
        total_income_tax = _calc_sg_income_tax(annual_income)

        # ---------------------------------------------------------------
        # 1. Enrich holdings with cost basis + dividend data
        # ---------------------------------------------------------------
        enriched_holdings = {}
        all_enriched = []
        dividend_details = []

        for asset_class, items in holdings.items():
            enriched = []
            for item in items:
                h = _generate_cost_basis(item)
                h["asset_class"] = asset_class
                domicile = _domicile(item, asset_class)
                h["domicile"] = domicile

                div_yield = _get_dividend_yield(item)
                annual_dividend = round(item["value"] * div_yield / 100, 2)

                # WHT: 30% on US dividends, 0% on SG, 0-15% on others
                if domicile == "US" and annual_dividend > 0:
                    wht_rate = 30.0
                elif domicile == "Other" and annual_dividend > 0:
                    wht_rate = 0.0
                else:
                    wht_rate = 0.0

                wht_amount = round(annual_dividend * wht_rate / 100, 2)
                net_dividend = round(annual_dividend - wht_amount, 2)

                h["dividend_yield_pct"] = div_yield
                h["annual_dividend"] = annual_dividend
                h["wht_rate"] = wht_rate
                h["wht_amount"] = wht_amount
                h["net_dividend"] = net_dividend

                enriched.append(h)
                all_enriched.append(h)

                if annual_dividend > 0:
                    dividend_details.append({
                        "name": item.get("name", ""),
                        "ticker": item.get("ticker"),
                        "asset_class": asset_class,
                        "domicile": domicile,
                        "value": item["value"],
                        "dividend_yield_pct": div_yield,
                        "annual_dividend": annual_dividend,
                        "wht_rate": wht_rate,
                        "wht_amount": wht_amount,
                        "net_dividend": net_dividend,
                        "tax_exempt": domicile == "SG",
                    })

            enriched_holdings[asset_class] = enriched

        # ---------------------------------------------------------------
        # 2. Unrealized P&L summary (existing feature)
        # ---------------------------------------------------------------
        gains = [h for h in all_enriched if h["unrealized_pnl"] > 0]
        losses = [h for h in all_enriched if h["unrealized_pnl"] < 0]
        flat = [h for h in all_enriched if h["unrealized_pnl"] == 0]

        total_unrealized_gains = round(sum(h["unrealized_pnl"] for h in gains), 2)
        total_unrealized_losses = round(sum(h["unrealized_pnl"] for h in losses), 2)
        net_unrealized_pnl = round(total_unrealized_gains + total_unrealized_losses, 2)

        # Tax-loss harvesting opportunities (losses > SGD 500)
        harvest_opportunities = sorted(
            [h for h in losses if abs(h["unrealized_pnl"]) > 500],
            key=lambda h: h["unrealized_pnl"],
        )

        # ---------------------------------------------------------------
        # 3. Dividend withholding tax analysis
        # ---------------------------------------------------------------
        total_sg_dividends = round(sum(d["annual_dividend"] for d in dividend_details if d["domicile"] == "SG"), 2)
        total_us_dividends = round(sum(d["annual_dividend"] for d in dividend_details if d["domicile"] == "US"), 2)
        total_other_dividends = round(sum(d["annual_dividend"] for d in dividend_details if d["domicile"] == "Other"), 2)
        total_wht_paid = round(sum(d["wht_amount"] for d in dividend_details), 2)
        total_dividends = round(total_sg_dividends + total_us_dividends + total_other_dividends, 2)
        total_net_dividends = round(sum(d["net_dividend"] for d in dividend_details), 2)

        # Potential savings: if US holdings were replaced with SG equivalents
        wht_savings_if_restructured = total_wht_paid

        dividend_tax_analysis = {
            "total_annual_dividends": total_dividends,
            "sg_dividends": total_sg_dividends,
            "us_dividends": total_us_dividends,
            "other_dividends": total_other_dividends,
            "total_wht_paid": total_wht_paid,
            "total_net_dividends": total_net_dividends,
            "wht_savings_if_restructured": wht_savings_if_restructured,
            "details": sorted(dividend_details, key=lambda d: d["annual_dividend"], reverse=True),
        }

        # ---------------------------------------------------------------
        # 4. SRS Tax Relief
        # ---------------------------------------------------------------
        srs_tax_savings = round(SRS_MAX_CONTRIBUTION * marginal_rate / 100, 2)
        srs_effective_bonus = round(srs_tax_savings / SRS_MAX_CONTRIBUTION * 100, 1) if SRS_MAX_CONTRIBUTION else 0

        srs_tax_relief = {
            "annual_income": annual_income,
            "marginal_tax_rate": marginal_rate,
            "total_income_tax": total_income_tax,
            "max_contribution": SRS_MAX_CONTRIBUTION,
            "tax_savings": srs_tax_savings,
            "effective_bonus_return_pct": srs_effective_bonus,
            "retirement_benefit": "Only 50% of SRS withdrawals are taxable at retirement (statutory age), and spread over 10 years — effectively halving the tax rate.",
            "eligible": age < 62,  # SRS withdrawal penalty-free at 62
            "years_to_retirement_withdrawal": max(0, 62 - age),
        }

        # ---------------------------------------------------------------
        # 5. CPF Cash Top-Up Tax Relief
        # ---------------------------------------------------------------
        cpf_self_savings = round(CPF_TOPUP_SELF_MAX * marginal_rate / 100, 2)
        cpf_family_savings = round(CPF_TOPUP_FAMILY_MAX * marginal_rate / 100, 2)

        cpf_topup_relief = {
            "max_self_topup": CPF_TOPUP_SELF_MAX,
            "max_family_topup": CPF_TOPUP_FAMILY_MAX,
            "max_combined": CPF_TOPUP_SELF_MAX + CPF_TOPUP_FAMILY_MAX,
            "tax_savings_self": cpf_self_savings,
            "tax_savings_family": cpf_family_savings,
            "tax_savings_combined": round(cpf_self_savings + cpf_family_savings, 2),
            "marginal_tax_rate": marginal_rate,
            "note": "Cash top-ups to your own or family members' CPF Special/Retirement Account qualify for tax relief.",
        }

        # ---------------------------------------------------------------
        # 6. Trading Income Risk Assessment
        # ---------------------------------------------------------------
        # IRAS may classify gains as taxable income if holding period is
        # short and trading is frequent. We flag holdings < 12 months.
        short_term = [
            h for h in all_enriched
            if h["holding_period_months"] < 12
            and h["asset_class"] not in ("cash",)
        ]
        short_term_gains = [h for h in short_term if h["unrealized_pnl"] > 0]
        short_term_total_gains = round(sum(h["unrealized_pnl"] for h in short_term_gains), 2)
        potential_tax_on_gains = round(short_term_total_gains * marginal_rate / 100, 2)

        if len(short_term) == 0:
            risk_level = "low"
        elif len(short_term_gains) <= 2 and short_term_total_gains < 5000:
            risk_level = "low"
        elif short_term_total_gains < 20000:
            risk_level = "moderate"
        else:
            risk_level = "high"

        trading_income_risk = {
            "short_term_holdings_count": len(short_term),
            "short_term_with_gains": len(short_term_gains),
            "short_term_total_gains": short_term_total_gains,
            "potential_tax_if_classified_as_income": potential_tax_on_gains,
            "risk_level": risk_level,
            "holdings": [
                {
                    "name": h.get("name", ""),
                    "ticker": h.get("ticker"),
                    "asset_class": h["asset_class"],
                    "holding_period_months": h["holding_period_months"],
                    "unrealized_pnl": h["unrealized_pnl"],
                    "unrealized_pnl_pct": h["unrealized_pnl_pct"],
                }
                for h in sorted(short_term, key=lambda x: x["holding_period_months"])
            ],
            "iras_factors": [
                "Frequency and volume of transactions",
                "Holding period of assets (short = higher risk)",
                "Whether the taxpayer has a trade or business of dealing in assets",
                "Source of financing and intent at time of purchase",
            ],
        }

        # ---------------------------------------------------------------
        # 7. Total Tax Savings Summary
        # ---------------------------------------------------------------
        total_potential_savings = round(
            srs_tax_savings
            + cpf_self_savings + cpf_family_savings
            + wht_savings_if_restructured,
            2,
        )

        tax_savings_summary = {
            "srs_relief": srs_tax_savings,
            "cpf_topup_relief": round(cpf_self_savings + cpf_family_savings, 2),
            "dividend_wht_recoverable": wht_savings_if_restructured,
            "total_potential_savings": total_potential_savings,
            "as_pct_of_income_tax": round(total_potential_savings / total_income_tax * 100, 1) if total_income_tax > 0 else 0,
        }

        # ---------------------------------------------------------------
        # 8. Suggestions
        # ---------------------------------------------------------------
        suggestions = _generate_sg_suggestions(
            dividend_tax_analysis, srs_tax_relief, cpf_topup_relief,
            trading_income_risk, harvest_opportunities, gains, losses, currency, age,
        )

        return {
            "user_id": user_id,
            "currency": currency,
            "annual_income": annual_income,
            "marginal_tax_rate": marginal_rate,
            "total_income_tax": total_income_tax,

            "holdings": enriched_holdings,
            "summary": {
                "total_unrealized_gains": total_unrealized_gains,
                "total_unrealized_losses": total_unrealized_losses,
                "net_unrealized_pnl": net_unrealized_pnl,
                "holdings_with_gains": len(gains),
                "holdings_with_losses": len(losses),
                "holdings_flat": len(flat),
            },

            "dividend_tax_analysis": dividend_tax_analysis,
            "srs_tax_relief": srs_tax_relief,
            "cpf_topup_relief": cpf_topup_relief,
            "trading_income_risk": trading_income_risk,
            "tax_savings_summary": tax_savings_summary,

            "gains": sorted(gains, key=lambda h: h["unrealized_pnl"], reverse=True),
            "losses": sorted(losses, key=lambda h: h["unrealized_pnl"]),
            "tax_loss_harvesting_opportunities": harvest_opportunities,
            "suggestions": suggestions,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _generate_sg_suggestions(
    div_analysis, srs, cpf, trading_risk, harvest_opps, gains, losses, currency, age,
):
    suggestions = []

    # SRS
    if srs["eligible"]:
        suggestions.append({
            "type": "srs",
            "priority": "high",
            "title": "Maximise SRS Contribution",
            "message": (
                f"Contributing the maximum {_format_sgd(SRS_MAX_CONTRIBUTION)} to your SRS account "
                f"saves you {_format_sgd(srs['tax_savings'])} in income tax this year "
                f"(at your {srs['marginal_tax_rate']}% marginal rate). "
                f"Investments within SRS grow tax-free, and only 50% of withdrawals are taxed at retirement."
            ),
        })

    # CPF Top-Up
    suggestions.append({
        "type": "cpf",
        "priority": "high",
        "title": "CPF Cash Top-Up Tax Relief",
        "message": (
            f"Top up your CPF Special/Retirement Account with up to {_format_sgd(CPF_TOPUP_SELF_MAX)} (self) "
            f"and {_format_sgd(CPF_TOPUP_FAMILY_MAX)} (family members) for a combined tax saving of "
            f"{_format_sgd(cpf['tax_savings_combined'])}. "
            f"This also boosts your retirement adequacy with CPF's risk-free 4% p.a. interest."
        ),
    })

    # Dividend WHT
    if div_analysis["total_wht_paid"] > 0:
        suggestions.append({
            "type": "dividend",
            "priority": "medium",
            "title": "Reduce US Dividend Withholding Tax",
            "message": (
                f"You're losing {_format_sgd(div_analysis['total_wht_paid'])}/year to US withholding tax "
                f"on {_format_sgd(div_analysis['us_dividends'])} in US dividends. Singapore has no tax treaty "
                f"with the US, so the full 30% applies. Consider: (1) holding US dividend stocks inside SRS "
                f"to defer income, (2) shifting to SG-listed equivalents (e.g., STI ETF, SG banks) whose "
                f"dividends are 100% tax-exempt under the one-tier system."
            ),
        })

    # SG dividend benefit
    if div_analysis["sg_dividends"] > 0:
        suggestions.append({
            "type": "dividend",
            "priority": "info",
            "title": "Singapore Dividends Are Tax-Free",
            "message": (
                f"You earn {_format_sgd(div_analysis['sg_dividends'])}/year in SG dividends — fully exempt "
                f"from tax under Singapore's one-tier corporate tax system. "
                f"This is a structural advantage of holding SG-listed equities."
            ),
        })

    # Trading income risk
    if trading_risk["risk_level"] in ("moderate", "high"):
        suggestions.append({
            "type": "trading_risk",
            "priority": "medium" if trading_risk["risk_level"] == "moderate" else "high",
            "title": "Trading Income Reclassification Risk",
            "message": (
                f"You have {trading_risk['short_term_holdings_count']} holdings held under 12 months with "
                f"{_format_sgd(trading_risk['short_term_total_gains'])} in unrealised gains. "
                f"If IRAS classifies these as trading income rather than capital gains, "
                f"you could owe up to {_format_sgd(trading_risk['potential_tax_if_classified_as_income'])} in tax. "
                f"Hold positions longer to strengthen your capital gains argument."
            ),
        })

    # Tax-loss harvesting
    if harvest_opps:
        total_harvestable = sum(abs(h["unrealized_pnl"]) for h in harvest_opps)
        suggestions.append({
            "type": "harvest",
            "priority": "low",
            "title": "Tax-Loss Harvesting (Strategic Rebalancing)",
            "message": (
                f"You have {_format_sgd(total_harvestable)} in harvestable losses across "
                f"{len(harvest_opps)} positions. While Singapore individuals are generally exempt "
                f"from capital gains tax, crystallising losses enables disciplined rebalancing — "
                f"sell underperformers and redeploy into higher-conviction assets."
            ),
        })

    # General SG tax note
    suggestions.append({
        "type": "info",
        "priority": "info",
        "title": "Singapore Tax Advantage",
        "message": (
            "Singapore does not levy capital gains tax on individuals. Your primary tax optimisation "
            "levers are: (1) SRS contributions for income tax relief, (2) CPF cash top-ups for additional relief, "
            "(3) minimising foreign withholding taxes on dividends, and (4) ensuring IRAS does not reclassify "
            "short-term gains as taxable trading income."
        ),
    })

    return suggestions
