from fastapi import APIRouter, HTTPException
import os
import httpx
import json
import asyncio
import feedparser
from datetime import datetime, timezone
from anthropic import Anthropic

router = APIRouter(prefix="/api", tags=["news"])

# RSS feeds from major financial news sources
RSS_FEEDS = [
    {"url": "https://finance.yahoo.com/news/rssindex", "source": "Yahoo Finance"},
    {"url": "https://www.cnbc.com/id/100003114/device/rss/rss.html", "source": "CNBC"},
    {"url": "https://www.cnbc.com/id/10001147/device/rss/rss.html", "source": "CNBC"},
    {"url": "https://feeds.reuters.com/reuters/businessNews", "source": "Reuters"},
    {"url": "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best", "source": "Reuters"},
    {"url": "https://www.ft.com/?format=rss", "source": "Financial Times"},
    {"url": "https://www.straitstimes.com/business?format=rss", "source": "The Straits Times"},
    {"url": "https://www.nasdaq.com/feed/rssoutbound?category=Markets", "source": "Nasdaq"},
    {"url": "https://feeds.marketwatch.com/marketwatch/topstories/", "source": "MarketWatch"},
    {"url": "https://feeds.bloomberg.com/markets/news.rss", "source": "Bloomberg"},
]

# Fallback mock data in case all feeds fail
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
        "id": "5",
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
]


def time_ago(dt: datetime) -> str:
    """Convert datetime to human-readable time ago string."""
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        m = int(seconds // 60)
        return f"{m} min ago"
    elif seconds < 86400:
        h = int(seconds // 3600)
        return f"{h} hour{'s' if h != 1 else ''} ago"
    else:
        d = int(seconds // 86400)
        return f"{d} day{'s' if d != 1 else ''} ago"


def parse_published(entry) -> datetime:
    """Extract published datetime from a feed entry."""
    for field in ("published_parsed", "updated_parsed"):
        val = getattr(entry, field, None)
        if val:
            try:
                from time import mktime
                return datetime.fromtimestamp(mktime(val), tz=timezone.utc)
            except Exception:
                pass
    return datetime.now(timezone.utc)


async def fetch_feed(client: httpx.AsyncClient, feed: dict) -> list[dict]:
    """Fetch and parse a single RSS feed."""
    try:
        resp = await client.get(feed["url"], timeout=8.0, follow_redirects=True)
        if resp.status_code != 200:
            return []
        parsed = feedparser.parse(resp.text)
        articles = []
        for entry in parsed.entries[:5]:  # Take top 5 per feed
            title = getattr(entry, "title", "").strip()
            link = getattr(entry, "link", "")
            summary = getattr(entry, "summary", getattr(entry, "description", "")).strip()
            # Clean HTML from summary
            if "<" in summary:
                import re
                summary = re.sub(r"<[^>]+>", "", summary).strip()
            if len(summary) > 300:
                summary = summary[:297] + "..."
            if not title:
                continue
            pub_dt = parse_published(entry)
            articles.append({
                "headline": title,
                "source": feed["source"],
                "published_at": pub_dt.isoformat(),
                "published_dt": pub_dt,
                "summary": summary or title,
                "url": link,
            })
        return articles
    except Exception:
        return []


async def analyze_with_claude(articles: list[dict]) -> list[dict]:
    """Use Claude to add sentiment, relevance, and asset class tags."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or not articles:
        # Return with default values if no API key
        for i, a in enumerate(articles):
            a["id"] = str(i + 1)
            a["sentiment"] = "neutral"
            a["relevance"] = "medium"
            a["affected_asset_classes"] = ["equities"]
            a["time_ago"] = time_ago(a.pop("published_dt"))
        return articles

    headlines_text = "\n".join(
        f"{i+1}. [{a['source']}] {a['headline']}"
        for i, a in enumerate(articles)
    )

    try:
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": f"""Analyze these financial news headlines. For each, provide:
- sentiment: "positive", "negative", or "neutral" (market impact)
- relevance: "high", "medium", or "low" (for a Singapore-based wealth management client)
- affected_asset_classes: array from ["equities", "bonds", "cash", "crypto", "tokenised_assets", "private_assets"]

Return ONLY a JSON array with objects having keys: index (1-based), sentiment, relevance, affected_asset_classes.

Headlines:
{headlines_text}"""
            }],
        )

        # Parse Claude's response
        text = response.content[0].text
        # Extract JSON from response
        start = text.find("[")
        end = text.rfind("]") + 1
        if start >= 0 and end > start:
            analysis = json.loads(text[start:end])
            analysis_map = {item["index"]: item for item in analysis}

            for i, a in enumerate(articles):
                info = analysis_map.get(i + 1, {})
                a["id"] = str(i + 1)
                a["sentiment"] = info.get("sentiment", "neutral")
                a["relevance"] = info.get("relevance", "medium")
                a["affected_asset_classes"] = info.get("affected_asset_classes", ["equities"])
                a["time_ago"] = time_ago(a.pop("published_dt"))
            return articles
    except Exception as e:
        print(f"Claude analysis failed: {e}")

    # Fallback: return with defaults
    for i, a in enumerate(articles):
        a["id"] = str(i + 1)
        a["sentiment"] = "neutral"
        a["relevance"] = "medium"
        a["affected_asset_classes"] = ["equities"]
        a["time_ago"] = time_ago(a.pop("published_dt"))
    return articles


# Cache to avoid hitting RSS feeds on every request
_cache = {"items": None, "fetched_at": None}
CACHE_TTL_SECONDS = 300  # 5 minutes


@router.get("/news")
async def get_news():
    try:
        # Check cache
        now = datetime.now(timezone.utc)
        if (
            _cache["items"] is not None
            and _cache["fetched_at"] is not None
            and (now - _cache["fetched_at"]).total_seconds() < CACHE_TTL_SECONDS
        ):
            # Update time_ago for cached items
            items = _cache["items"]
            return {"items": items}

        # Fetch all RSS feeds concurrently
        async with httpx.AsyncClient(
            headers={"User-Agent": "WealthPulse/1.0 (Financial News Aggregator)"}
        ) as client:
            tasks = [fetch_feed(client, feed) for feed in RSS_FEEDS]
            results = await asyncio.gather(*tasks)

        # Flatten and deduplicate by headline
        all_articles = []
        seen_headlines = set()
        for feed_articles in results:
            for article in feed_articles:
                # Simple dedup by headline similarity
                headline_key = article["headline"].lower().strip()[:80]
                if headline_key not in seen_headlines:
                    seen_headlines.add(headline_key)
                    all_articles.append(article)

        # Sort by publish date (newest first) and take top 15
        all_articles.sort(key=lambda x: x["published_dt"], reverse=True)
        all_articles = all_articles[:15]

        if not all_articles:
            # All feeds failed — use mock data
            return {"items": MOCK_NEWS}

        # Analyze with Claude for sentiment/relevance
        items = await analyze_with_claude(all_articles)

        # Cache results
        _cache["items"] = items
        _cache["fetched_at"] = now

        return {"items": items}
    except Exception as e:
        print(f"News fetch error: {e}")
        return {"items": MOCK_NEWS}
