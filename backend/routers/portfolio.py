from fastapi import APIRouter, HTTPException
import json
import os

router = APIRouter(prefix="/api", tags=["portfolio"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_data")


def load_portfolios():
    with open(os.path.join(DATA_DIR, "portfolios.json")) as f:
        return json.load(f)


@router.get("/portfolio/{user_id}")
async def get_portfolio(user_id: str):
    try:
        portfolios = load_portfolios()
        if user_id not in portfolios:
            raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")
        data = portfolios[user_id]
        return {
            "user_id": data["user_id"],
            "name": data["name"],
            "total_wealth": data["total_wealth"],
            "currency": data["currency"],
            "holdings": data["holdings"],
            "performance": data["performance"],
            "wealth_history": data["wealth_history"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
