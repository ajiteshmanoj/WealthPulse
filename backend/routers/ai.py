from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os

router = APIRouter(prefix="/api", tags=["ai"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_data")

FALLBACK_RECOMMENDATIONS = {
    "alex_tan": [
        {
            "priority": "urgent",
            "title": "Reduce Crypto Overexposure to Below 25%",
            "description": "Your 35% crypto allocation significantly exceeds recommended levels for your risk profile. Consider rebalancing 10-15% into diversified equities or bonds to reduce portfolio volatility and improve your behavioral resilience score.",
            "action_type": "rebalance"
        },
        {
            "priority": "suggested",
            "title": "Increase Emergency Cash Buffer to 3 Months' Expenses",
            "description": "With only 8% in cash and a property purchase goal in 5 years, building a 3-6 month emergency fund (approximately SGD 10,000) would improve liquidity score and protect your down payment timeline.",
            "action_type": "save"
        },
        {
            "priority": "consider",
            "title": "Explore SGD-denominated Tokenised Bonds for Stable Yield",
            "description": "Consider allocating 5% from crypto to tokenised Singapore government bonds. This maintains your digital asset exposure while adding stability and improving goal alignment for your property purchase.",
            "action_type": "invest"
        }
    ],
    "sarah_lim": [
        {
            "priority": "suggested",
            "title": "Consider Increasing Monthly Retirement Contributions by SGD 500",
            "description": "While your portfolio is well-diversified, increasing monthly contributions from SGD 3,500 to SGD 4,000 would significantly improve your retirement probability of success from 72% to over 80%.",
            "action_type": "save"
        },
        {
            "priority": "suggested",
            "title": "Rebalance Equity Holdings Toward Dividend Stocks",
            "description": "As you approach your mid-career phase, gradually shifting 5% from growth equities to dividend-paying stocks like DBS and OCBC would provide income stability and reduce volatility.",
            "action_type": "rebalance"
        },
        {
            "priority": "consider",
            "title": "Review Insurance Coverage for Income Protection",
            "description": "With SGD 820,000 in wealth and a family to support, ensure your critical illness and income protection coverage matches your growing asset base and lifestyle expenses.",
            "action_type": "protect"
        }
    ],
    "david_chen": [
        {
            "priority": "suggested",
            "title": "Reduce Cash Holdings from 28% to 18%",
            "description": "Your cash allocation is conservative even for your risk profile. Redeploying SGD 124,000 into a mix of short-duration bonds and tokenised treasury products would improve returns without significantly increasing risk.",
            "action_type": "rebalance"
        },
        {
            "priority": "suggested",
            "title": "Add 3-5% Allocation to Tokenised Assets for Digital Readiness",
            "description": "Your zero allocation to tokenised assets impacts your digital readiness score. Consider Schroders' tokenised private equity fund or tokenised SGD bonds as a low-risk entry point.",
            "action_type": "invest"
        },
        {
            "priority": "consider",
            "title": "Set Up Automatic Monthly Investment for Education Fund",
            "description": "Automating your SGD 800 monthly contribution into a balanced education fund ensures consistency and removes emotional decision-making from the process.",
            "action_type": "automate"
        }
    ]
}


class RecommendRequest(BaseModel):
    user_id: str


class ClientReportRequest(BaseModel):
    client_id: str


FALLBACK_REPORTS = {
    "aisha_malik": {
        "subject": "Your Wealth Wellness Review — March 2026",
        "greeting": "Dear Aisha,",
        "summary": "Your current Wealth Wellness Score is 38 out of 100, which places your portfolio in the 'At Risk' category. With SGD 420,000 in assets under management, your portfolio is heavily concentrated — 85% is allocated to a single stock (Grab) — leaving you exposed to significant downside risk with no bonds or fixed income to cushion volatility.",
        "key_findings": [
            "Extreme concentration risk: 85% of your SGD 420K portfolio sits in a single equity (Grab), far exceeding the recommended 10% single-stock limit for a moderate risk profile.",
            "Zero fixed income allocation: With no bonds or fixed income, your portfolio lacks the stability buffer essential for your moderate risk profile and your Children's Education goal.",
            "Goal misalignment: Your Children's Education fund is currently off track — the high-volatility, single-stock strategy is inconsistent with the predictable returns needed for education planning."
        ],
        "recommendations": [
            "Immediately reduce Grab exposure to below 25% by diversifying SGD 250,000 into a mix of Singapore blue-chip equities (DBS, OCBC) and a global equity ETF to maintain growth potential while lowering concentration risk.",
            "Allocate 20-25% (approximately SGD 100,000) into investment-grade bonds or a short-duration bond fund to build a fixed income foundation aligned with your moderate risk profile.",
            "Set up a dedicated Children's Education portfolio with monthly contributions of SGD 1,500 into a balanced fund, which would put you back on track for your education funding goal within 18 months."
        ],
        "closing": "I'd love to schedule a 30-minute call this week to discuss a phased rebalancing plan that protects your wealth while keeping you on track for your children's education goals. Please let me know your availability.\n\nWarm regards,\nYour WealthPulse Adviser"
    },
    "brandon_teo": {
        "subject": "Your Wealth Wellness Review — March 2026",
        "greeting": "Dear Brandon,",
        "summary": "Your Wealth Wellness Score stands at 43 out of 100, flagging your portfolio as 'At Risk'. With SGD 180,000 in total assets and a 45% cryptocurrency allocation, your portfolio carries outsized volatility and lacks fundamental safety nets like an emergency fund.",
        "key_findings": [
            "Crypto overexposure: At 45% (SGD 81,000), your cryptocurrency allocation is nearly triple the recommended maximum for even aggressive profiles, exposing you to extreme drawdown risk.",
            "No emergency fund: With only 3% in cash (SGD 5,400), you have less than one month of expenses in liquid reserves — any market shock or personal emergency could force you to sell assets at a loss.",
            "High behavioral risk: Your trading patterns suggest reactive, emotionally-driven decisions which historically erode returns by 2-4% annually."
        ],
        "recommendations": [
            "Build an emergency fund of SGD 15,000 (3 months' expenses) by redirecting crypto profits — this single step would improve your wellness score by approximately 8 points.",
            "Reduce crypto allocation from 45% to 20% over the next 3 months, redeploying SGD 45,000 into diversified equities and at least 5-10% into bonds for foundational stability.",
            "Implement a systematic investment plan (SIP) of SGD 1,000/month into a low-cost global index fund to build disciplined investing habits and support your Financial Independence goal."
        ],
        "closing": "At 26, you have an incredible advantage — time. Let's channel that into a strategy that builds wealth sustainably. I'd like to walk you through a step-by-step rebalancing plan. Shall we set up a call this week?\n\nBest regards,\nYour WealthPulse Adviser"
    },
    "christine_ho": {
        "subject": "Your Wealth Wellness Review — March 2026",
        "greeting": "Dear Christine,",
        "summary": "Your current Wealth Wellness Score is 48 out of 100, indicating significant imbalances that need attention. With SGD 780,000 in assets under management and a balanced risk profile, your portfolio shows poor diversification and a growing drift from your Wealth Preservation goal.",
        "key_findings": [
            "Diversification gap: Despite a balanced risk profile, your portfolio's sector and geographic concentration scores are below benchmark — your 35% equities are clustered in similar sectors, reducing true diversification.",
            "Goal alignment drift: Your Wealth Preservation goal is off track, with your last portfolio review dating back to December 2025 — over 3 months without rebalancing in a volatile market environment.",
            "Excess cash drag: At 20% cash (SGD 156,000), your portfolio is losing purchasing power to inflation — at current Singapore CPI rates, this represents approximately SGD 5,500 in annual real-value erosion."
        ],
        "recommendations": [
            "Rebalance equities across 3-4 uncorrelated sectors and add international exposure — consider allocating SGD 50,000 into a global dividend ETF to improve diversification without increasing risk.",
            "Redeploy 10% of cash holdings (SGD 78,000) into a laddered bond portfolio with 1-3 year maturities, providing better returns while maintaining the liquidity your Wealth Preservation goal requires.",
            "Schedule quarterly portfolio reviews (next review: April 2026) with automated rebalancing triggers to prevent future goal alignment drift."
        ],
        "closing": "Your portfolio has strong bones — SGD 780,000 is a solid foundation. With a few strategic adjustments, we can significantly improve your wellness score and get your Wealth Preservation goal back on track. Let's discuss the specifics at your earliest convenience.\n\nKind regards,\nYour WealthPulse Adviser"
    }
}


@router.post("/ai/client-report")
async def generate_client_report(req: ClientReportRequest):
    try:
        with open(os.path.join(DATA_DIR, "clients.json")) as f:
            clients_data = json.load(f)

        client = None
        for c in clients_data.get("clients", []):
            if c["id"] == req.client_id:
                client = c
                break

        if not client:
            raise HTTPException(status_code=404, detail=f"Client '{req.client_id}' not found")

        api_key = os.getenv("ANTHROPIC_API_KEY")

        if api_key:
            try:
                import anthropic

                ai_client = anthropic.Anthropic(api_key=api_key)

                system_prompt = """You are WealthPulse AI, a professional wealth adviser assistant for a Singapore-based wealth management firm.
Generate a personalized adviser-to-client email report based on the client data provided.

Return ONLY a JSON object with this exact structure:
{
  "subject": "Your Wealth Wellness Review — March 2026",
  "greeting": "Dear [First Name],",
  "summary": "2-3 sentences on overall wellness status, mentioning specific AUM and wellness score",
  "key_findings": ["finding1", "finding2", "finding3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "closing": "Professional sign-off with call-to-action"
}

Rules:
- Be specific with numbers: mention actual AUM, wellness score, allocation percentages, and risk flags
- Recommendations must be actionable with specific dollar amounts or percentages
- Tone: professional, warm, advisory — not alarmist
- Reference the client's specific goal and whether it's on/off track
- Keep each key_finding to 1-2 sentences
- Keep each recommendation to 1-2 sentences with a concrete action
- All monetary values in SGD"""

                user_prompt = f"""Generate an adviser email report for this client:

Name: {client['name']}
Age: {client['age']}
AUM: SGD {client['aum']:,}
Risk Profile: {client['risk_profile']}
Wellness Score: {client['wellness_score']}/100
Wellness Label: {client['wellness_label']}
Risk Flags: {json.dumps(client['risk_flags'])}
Portfolio: Equities {client['portfolio_summary']['equities_pct']}%, Bonds {client['portfolio_summary']['bonds_pct']}%, Cash {client['portfolio_summary']['cash_pct']}%, Crypto {client['portfolio_summary']['crypto_pct']}%, Other {client['portfolio_summary']['other_pct']}%
Goal: {client['goal_name']} — {'On Track' if client['goal_on_track'] else 'Off Track'}
Last Review: {client['last_review']}"""

                message = ai_client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=1500,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_prompt}],
                )

                response_text = message.content[0].text.strip()
                if response_text.startswith("{"):
                    report = json.loads(response_text)
                else:
                    start = response_text.find("{")
                    end = response_text.rfind("}") + 1
                    if start >= 0 and end > start:
                        report = json.loads(response_text[start:end])
                    else:
                        raise ValueError("Could not parse AI response")

                return {
                    "client_name": client["name"],
                    "report": report,
                    "generated_by": "ai"
                }

            except Exception:
                pass  # Fall through to fallback

        # Fallback
        if req.client_id in FALLBACK_REPORTS:
            return {
                "client_name": client["name"],
                "report": FALLBACK_REPORTS[req.client_id],
                "generated_by": "fallback"
            }

        # Generic fallback for clients without hardcoded reports
        return {
            "client_name": client["name"],
            "report": {
                "subject": "Your Wealth Wellness Review — March 2026",
                "greeting": f"Dear {client['name'].split()[0]},",
                "summary": f"Your current Wealth Wellness Score is {client['wellness_score']} out of 100 with SGD {client['aum']:,} in assets under management. Your portfolio follows a {client['risk_profile']} risk profile and your {client['goal_name']} goal is {'on track' if client['goal_on_track'] else 'currently off track'}.",
                "key_findings": [
                    f"Your portfolio allocation stands at {client['portfolio_summary']['equities_pct']}% equities, {client['portfolio_summary']['bonds_pct']}% bonds, {client['portfolio_summary']['cash_pct']}% cash, and {client['portfolio_summary']['crypto_pct']}% crypto.",
                    f"Risk flags identified: {', '.join(client['risk_flags']) if client['risk_flags'] else 'None — your portfolio is in good standing.'}",
                    f"Your {client['goal_name']} goal is {'on track and progressing well' if client['goal_on_track'] else 'off track and requires attention to get back on target'}."
                ],
                "recommendations": [
                    "Schedule a portfolio review to discuss rebalancing opportunities aligned with your current risk profile.",
                    "Review your emergency fund and liquidity buffer to ensure adequate coverage for 3-6 months of expenses.",
                    "Consider setting up automated monthly contributions to stay consistent with your investment goals."
                ],
                "closing": f"I look forward to discussing these insights with you and ensuring your wealth strategy remains aligned with your goals. Please feel free to reach out to schedule a review.\n\nWarm regards,\nYour WealthPulse Adviser"
            },
            "generated_by": "fallback"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/recommend")
async def get_recommendations(req: RecommendRequest):
    try:
        api_key = os.getenv("ANTHROPIC_API_KEY")

        if api_key:
            try:
                import anthropic

                # Load context
                with open(os.path.join(DATA_DIR, "portfolios.json")) as f:
                    portfolios = json.load(f)
                with open(os.path.join(DATA_DIR, "goals.json")) as f:
                    goals = json.load(f)

                if req.user_id not in portfolios:
                    raise HTTPException(status_code=404, detail=f"User '{req.user_id}' not found")

                portfolio = portfolios[req.user_id]
                goal = goals.get(req.user_id, {})

                client = anthropic.Anthropic(api_key=api_key)

                system_prompt = """You are WealthPulse AI, an expert wealth advisor AI for Singapore-based investors.
Analyze the portfolio and goal data provided, then return EXACTLY 3 recommendations as a JSON array.
Each recommendation must have: priority ("urgent"|"suggested"|"consider"), title (short, actionable), description (2-3 sentences with specific numbers), action_type (one of: rebalance, save, invest, protect, automate).
Return ONLY the JSON array, no other text."""

                user_prompt = f"""Portfolio: {json.dumps(portfolio, indent=2)}
Goal: {json.dumps(goal, indent=2)}
Please provide 3 personalized recommendations."""

                message = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=1024,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_prompt}],
                )

                response_text = message.content[0].text.strip()
                # Try to parse JSON from response
                if response_text.startswith("["):
                    recommendations = json.loads(response_text)
                else:
                    # Try to extract JSON array
                    start = response_text.find("[")
                    end = response_text.rfind("]") + 1
                    if start >= 0 and end > start:
                        recommendations = json.loads(response_text[start:end])
                    else:
                        raise ValueError("Could not parse AI response")

                return {"recommendations": recommendations, "source": "ai"}

            except Exception:
                pass  # Fall through to mock

        # Fallback to hardcoded recommendations
        if req.user_id not in FALLBACK_RECOMMENDATIONS:
            raise HTTPException(status_code=404, detail=f"User '{req.user_id}' not found")

        return {
            "recommendations": FALLBACK_RECOMMENDATIONS[req.user_id],
            "source": "mock"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
