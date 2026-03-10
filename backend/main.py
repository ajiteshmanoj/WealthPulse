from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
import os

load_dotenv()

app = FastAPI(
    title="WealthPulse API",
    description="AI-powered Wealth Wellness Hub — NFC FinTech Hackathon 2026",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import portfolio, wellness, news, scenarios, ai, goals, whatif, tax

app.include_router(portfolio.router)
app.include_router(wellness.router)
app.include_router(news.router)
app.include_router(scenarios.router)
app.include_router(ai.router)
app.include_router(goals.router)
app.include_router(whatif.router)
app.include_router(tax.router)

DATA_DIR = os.path.join(os.path.dirname(__file__), "mock_data")


@app.get("/")
async def root():
    return {
        "app": "WealthPulse",
        "tagline": "AI-Powered Wealth Wellness Hub",
        "version": "1.0.0",
        "hackathon": "NFC FinTech Innovator's Hackathon 2026",
        "problem_statement": "Schroders — Wealth Wellness",
    }


@app.get("/api/clients")
async def get_clients():
    try:
        with open(os.path.join(DATA_DIR, "clients.json")) as f:
            data = json.load(f)
        return data
    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
async def health():
    return {"status": "ok", "api_key_set": bool(os.getenv("ANTHROPIC_API_KEY"))}
