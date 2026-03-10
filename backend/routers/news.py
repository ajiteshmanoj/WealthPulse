from fastapi import APIRouter, HTTPException
import os
import httpx
from datetime import datetime, timedelta

router = APIRouter(prefix="/api", tags=["news"])

MOCK_NEWS = [
    {
        "id": "1",
        "headline": "Fed Signals Potential Rate Cut in Q2 2026 Amid Slowing Growth",
        "source": "Reuters",
        "published_at": "2026-03-10T06:00:00Z",
        "time_ago": "2 hours ago",
        "sentiment": "positive",
        "relevance": "high",
        "affected_asset_classes": ["equities", "bonds"],
        "summary": "Federal Reserve Chair indicated openness to rate cuts as inflation trends toward the 2% target, boosting equity futures and bond prices across global markets.",
        "url": "https://reuters.com"
    },
    {
        "id": "2",
        "headline": "MAS Maintains Tight Monetary Policy Stance on SGD Appreciation",
        "source": "The Straits Times",
        "published_at": "2026-03-10T04:30:00Z",
        "time_ago": "4 hours ago",
        "sentiment": "neutral",
        "relevance": "high",
        "affected_asset_classes": ["cash", "bonds"],
        "summary": "The Monetary Authority of Singapore maintained its policy band slope, signalling continued SGD strength against regional currencies to manage imported inflation.",
        "url": "https://straitstimes.com"
    },
    {
        "id": "3",
        "headline": "Bitcoin Surges Past $95,000 on Spot ETF Inflows and Institutional Demand",
        "source": "CoinDesk",
        "published_at": "2026-03-09T22:00:00Z",
        "time_ago": "10 hours ago",
        "sentiment": "positive",
        "relevance": "high",
        "affected_asset_classes": ["crypto", "tokenised_assets"],
        "summary": "Bitcoin hit new 2026 highs driven by record spot ETF inflows exceeding $2B in a single week and growing adoption among sovereign wealth funds in Asia.",
        "url": "https://coindesk.com"
    },
    {
        "id": "4",
        "headline": "EU Passes Landmark Tokenisation Framework for Real-World Assets",
        "source": "Financial Times",
        "published_at": "2026-03-09T18:00:00Z",
        "time_ago": "14 hours ago",
        "sentiment": "positive",
        "relevance": "high",
        "affected_asset_classes": ["tokenised_assets"],
        "summary": "The European Union approved comprehensive regulations enabling tokenisation of bonds, real estate, and private equity, expected to unlock $16 trillion in assets by 2030.",
        "url": "https://ft.com"
    },
    {
        "id": "5",
        "headline": "US Inflation Cools to 2.3% — Lowest Since Early 2021",
        "source": "Bloomberg",
        "published_at": "2026-03-09T14:00:00Z",
        "time_ago": "18 hours ago",
        "sentiment": "positive",
        "relevance": "medium",
        "affected_asset_classes": ["equities", "bonds", "cash"],
        "summary": "Consumer Price Index data shows inflation continuing its downward trend, strengthening the case for monetary easing and supporting risk asset valuations.",
        "url": "https://bloomberg.com"
    },
    {
        "id": "6",
        "headline": "South China Sea Tensions Escalate — Markets Eye Geopolitical Risk",
        "source": "CNBC",
        "published_at": "2026-03-09T10:00:00Z",
        "time_ago": "22 hours ago",
        "sentiment": "negative",
        "relevance": "medium",
        "affected_asset_classes": ["equities", "crypto"],
        "summary": "Renewed territorial disputes in the South China Sea have increased geopolitical risk premiums across Asian equity markets, with safe-haven flows into gold and SGD.",
        "url": "https://cnbc.com"
    },
    {
        "id": "7",
        "headline": "SGD Strengthens to 1.28 Against USD on Safe-Haven Flows",
        "source": "Business Times",
        "published_at": "2026-03-08T16:00:00Z",
        "time_ago": "1 day ago",
        "sentiment": "neutral",
        "relevance": "medium",
        "affected_asset_classes": ["cash", "equities"],
        "summary": "The Singapore dollar appreciated against the US dollar as investors sought safe-haven Asian currencies amid global uncertainty, impacting export-oriented stocks.",
        "url": "https://businesstimes.com.sg"
    },
    {
        "id": "8",
        "headline": "Schroders Launches Asia's First Tokenised Private Equity Fund",
        "source": "Asset Management Today",
        "published_at": "2026-03-08T09:00:00Z",
        "time_ago": "2 days ago",
        "sentiment": "positive",
        "relevance": "high",
        "affected_asset_classes": ["private_assets", "tokenised_assets"],
        "summary": "Schroders Capital partnered with a Singapore-based blockchain firm to launch a tokenised private equity fund, lowering minimum investment to SGD 10,000 from SGD 250,000.",
        "url": "https://schroders.com"
    },
    {
        "id": "9",
        "headline": "Singapore REITs Rally as Office Vacancy Rates Drop to 5-Year Low",
        "source": "The Edge Singapore",
        "published_at": "2026-03-07T12:00:00Z",
        "time_ago": "3 days ago",
        "sentiment": "positive",
        "relevance": "medium",
        "affected_asset_classes": ["equities", "private_assets"],
        "summary": "Singapore-listed REITs posted strong gains as CBD office vacancy rates fell to 8.2%, the lowest since 2021, driven by return-to-office mandates and limited new supply.",
        "url": "https://theedgesingapore.com"
    },
    {
        "id": "10",
        "headline": "Hong Kong Crypto Regulation Tightens — Exchanges Face New Compliance Rules",
        "source": "South China Morning Post",
        "published_at": "2026-03-07T08:00:00Z",
        "time_ago": "3 days ago",
        "sentiment": "negative",
        "relevance": "medium",
        "affected_asset_classes": ["crypto", "tokenised_assets"],
        "summary": "Hong Kong's SFC announced stricter compliance requirements for crypto exchanges, potentially limiting retail access and increasing operational costs for platforms.",
        "url": "https://scmp.com"
    }
]


@router.get("/news")
async def get_news():
    try:
        news_api_key = os.getenv("NEWS_API_KEY")
        if news_api_key:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        "https://newsapi.org/v2/top-headlines",
                        params={"category": "business", "pageSize": 10, "apiKey": news_api_key},
                        timeout=5.0,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        items = []
                        for i, article in enumerate(data.get("articles", [])[:10]):
                            items.append({
                                "id": str(i + 1),
                                "headline": article.get("title", ""),
                                "source": article.get("source", {}).get("name", ""),
                                "published_at": article.get("publishedAt", ""),
                                "time_ago": "",
                                "sentiment": "neutral",
                                "relevance": "medium",
                                "affected_asset_classes": ["equities"],
                                "summary": article.get("description", ""),
                                "url": article.get("url", ""),
                            })
                        return {"items": items}
            except Exception:
                pass  # Fall through to mock data

        return {"items": MOCK_NEWS}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
