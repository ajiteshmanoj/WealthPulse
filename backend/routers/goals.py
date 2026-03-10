from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
import os
import random
import math

router = APIRouter(prefix="/api", tags=["goals"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_data")


def load_goals():
    with open(os.path.join(DATA_DIR, "goals.json")) as f:
        return json.load(f)


class GoalCalcRequest(BaseModel):
    user_id: str
    goal_type: str
    goal_name: str
    target_amount: float
    target_years: int
    current_savings_toward_goal: float
    monthly_contribution: float
    expected_return_pct: float


class ExpenseRequest(BaseModel):
    user_id: str
    monthly_income: float
    expenses: dict


def future_value(pv, pmt, rate_monthly, months):
    """Calculate future value with monthly contributions."""
    if rate_monthly == 0:
        return pv + pmt * months
    fv_lump = pv * (1 + rate_monthly) ** months
    fv_annuity = pmt * (((1 + rate_monthly) ** months - 1) / rate_monthly)
    return fv_lump + fv_annuity


def monte_carlo(current, monthly, expected_return, years, target, n_sims=1000):
    """Run Monte Carlo simulation."""
    random.seed(42)
    std_dev = 8.0
    months = years * 12
    monthly_mean = expected_return / 12
    monthly_std = std_dev / math.sqrt(12)

    final_values = []
    for _ in range(n_sims):
        value = current
        for m in range(months):
            monthly_return = random.gauss(monthly_mean, monthly_std) / 100
            value = value * (1 + monthly_return) + monthly
            value = max(0, value)
        final_values.append(value)

    final_values.sort()
    success_count = sum(1 for v in final_values if v >= target)
    probability = success_count / n_sims

    p10 = final_values[int(n_sims * 0.10)]
    p50 = final_values[int(n_sims * 0.50)]
    p90 = final_values[int(n_sims * 0.90)]

    return probability, p10, p50, p90


def calc_required_monthly(target, current, rate_monthly, months):
    """Calculate required monthly contribution to reach target."""
    if rate_monthly == 0:
        return (target - current) / months if months > 0 else 0
    fv_current = current * (1 + rate_monthly) ** months
    remaining = target - fv_current
    if remaining <= 0:
        return 0
    annuity_factor = ((1 + rate_monthly) ** months - 1) / rate_monthly
    return remaining / annuity_factor


@router.post("/goals/calculate")
async def calculate_goal(req: GoalCalcRequest):
    try:
        monthly_rate = req.expected_return_pct / 100 / 12
        months = req.target_years * 12

        # Required monthly contribution
        monthly_required = calc_required_monthly(
            req.target_amount, req.current_savings_toward_goal, monthly_rate, months
        )

        # Projected future value with current plan
        projected_fv = future_value(
            req.current_savings_toward_goal, req.monthly_contribution, monthly_rate, months
        )

        total_contributions = req.current_savings_toward_goal + (req.monthly_contribution * months)
        total_returns = projected_fv - total_contributions
        shortfall_or_surplus = projected_fv - req.target_amount

        # Required return to meet goal with current contributions
        # Binary search for required return
        required_return = req.expected_return_pct
        if shortfall_or_surplus < 0:
            low, high = 0.0, 50.0
            for _ in range(50):
                mid = (low + high) / 2
                test_fv = future_value(
                    req.current_savings_toward_goal, req.monthly_contribution, mid / 100 / 12, months
                )
                if test_fv < req.target_amount:
                    low = mid
                else:
                    high = mid
            required_return = round((low + high) / 2, 1)

        # Monte Carlo
        probability, p10, p50, p90 = monte_carlo(
            req.current_savings_toward_goal, req.monthly_contribution,
            req.expected_return_pct, req.target_years, req.target_amount
        )

        # Wealth projection (yearly)
        wealth_projection = []
        milestones = []
        for year in range(req.target_years + 1):
            m = year * 12
            value = future_value(
                req.current_savings_toward_goal, req.monthly_contribution, monthly_rate, m
            )
            contrib_total = req.current_savings_toward_goal + (req.monthly_contribution * m)
            wealth_projection.append({
                "year": year,
                "value": round(value),
                "contributions_total": round(contrib_total),
            })
            pct_of_goal = value / req.target_amount * 100
            if pct_of_goal >= 25 and not any(ms["label"] == "25% milestone" for ms in milestones):
                milestones.append({"year": year, "value": round(value), "pct_of_goal": round(pct_of_goal), "label": "25% milestone"})
            if pct_of_goal >= 50 and not any(ms["label"] == "50% milestone" for ms in milestones):
                milestones.append({"year": year, "value": round(value), "pct_of_goal": round(pct_of_goal), "label": "50% milestone"})
            if pct_of_goal >= 75 and not any(ms["label"] == "75% milestone" for ms in milestones):
                milestones.append({"year": year, "value": round(value), "pct_of_goal": round(pct_of_goal), "label": "75% milestone"})
            if pct_of_goal >= 100 and not any(ms["label"] == "Goal reached!" for ms in milestones):
                milestones.append({"year": year, "value": round(value), "pct_of_goal": round(pct_of_goal), "label": "Goal reached!"})

        # Scenarios
        scenarios = {}
        for label, ret_pct in [("conservative", 4), ("moderate", 10), ("aggressive", 20)]:
            r = ret_pct / 100 / 12
            fv = future_value(req.current_savings_toward_goal, req.monthly_contribution, r, months)
            scenarios[label] = {
                "return_pct": ret_pct,
                "final_value": round(fv),
                "meets_goal": fv >= req.target_amount,
            }

        return {
            "monthly_required": round(monthly_required, 2),
            "years_to_goal": req.target_years,
            "total_contributions": round(total_contributions),
            "total_returns": round(total_returns),
            "shortfall_or_surplus": round(shortfall_or_surplus),
            "required_return_to_meet_goal": required_return,
            "probability_of_success": round(probability * 100, 1),
            "monte_carlo": {"p10": round(p10), "p50": round(p50), "p90": round(p90)},
            "wealth_projection": wealth_projection,
            "milestones": milestones,
            "scenarios": scenarios,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/goals/expenses")
async def analyze_expenses(req: ExpenseRequest):
    try:
        total_expenses = sum(req.expenses.values())
        monthly_surplus = req.monthly_income - total_expenses
        surplus_pct = (monthly_surplus / req.monthly_income * 100) if req.monthly_income > 0 else 0
        investable_surplus = max(0, monthly_surplus * 0.8)  # 80% of surplus is investable

        # Load goal to check savings gap
        goals = load_goals()
        goal = goals.get(req.user_id, {})
        monthly_contribution = goal.get("monthly_contribution", 0)
        savings_gap = max(0, monthly_contribution - monthly_surplus)

        suggestions = []
        expense_breakdown = {}
        for category, amount in req.expenses.items():
            pct = amount / req.monthly_income * 100 if req.monthly_income > 0 else 0
            expense_breakdown[category] = {
                "amount": amount,
                "pct_of_income": round(pct, 1)
            }

        # Generate suggestions
        housing_pct = req.expenses.get("housing", 0) / req.monthly_income * 100 if req.monthly_income > 0 else 0
        if housing_pct > 30:
            suggestions.append(f"Housing costs ({housing_pct:.0f}% of income) exceed the recommended 30%. Consider refinancing or downsizing.")

        lifestyle_pct = req.expenses.get("lifestyle", 0) / req.monthly_income * 100 if req.monthly_income > 0 else 0
        if lifestyle_pct > 15:
            suggestions.append(f"Lifestyle spending ({lifestyle_pct:.0f}% of income) is above 15%. Reducing by SGD {req.expenses.get('lifestyle', 0) * 0.2:.0f}/month could accelerate your goals.")

        if surplus_pct < 20:
            suggestions.append("Your savings rate is below the recommended 20%. Look for areas to reduce discretionary spending.")

        if savings_gap > 0:
            suggestions.append(f"You need an additional SGD {savings_gap:.0f}/month to meet your goal contribution target.")

        if not suggestions:
            suggestions.append("Great job! Your expense management is healthy. Consider increasing investments with your surplus.")

        return {
            "total_expenses": round(total_expenses),
            "monthly_surplus": round(monthly_surplus),
            "surplus_pct_of_income": round(surplus_pct, 1),
            "investable_surplus": round(investable_surplus),
            "expense_breakdown": expense_breakdown,
            "savings_gap": round(savings_gap),
            "suggestions": suggestions,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goals/{user_id}")
async def get_goal(user_id: str):
    try:
        goals = load_goals()
        if user_id not in goals:
            raise HTTPException(status_code=404, detail=f"No goal found for user '{user_id}'")

        goal = goals[user_id]

        # Calculate current progress
        monthly_rate = goal["expected_return_pct"] / 100 / 12
        months = goal["target_years"] * 12
        projected_fv = future_value(
            goal["current_savings_toward_goal"], goal["monthly_contribution"], monthly_rate, months
        )
        progress_pct = goal["current_savings_toward_goal"] / goal["target_amount"] * 100
        on_track = projected_fv >= goal["target_amount"]

        return {
            **goal,
            "progress_pct": round(progress_pct, 1),
            "projected_final_value": round(projected_fv),
            "on_track": on_track,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
