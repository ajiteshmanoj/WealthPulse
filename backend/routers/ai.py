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
