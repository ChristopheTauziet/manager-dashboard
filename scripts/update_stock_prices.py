#!/usr/bin/env python3
"""
Fetch latest regular-market prices for stocks listed in data/assets.json
and write data/stock-prices.json.

Skips non-tradeable rows: tickers starting with "_" (e.g. _MISC) and
entries with fixedValue (manual total, no ticker).
"""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS_PATH = ROOT / "data" / "assets.json"
PRICES_PATH = ROOT / "data" / "stock-prices.json"

UA = "Mozilla/5.0 (compatible; ManagerDashboard/1.0; +https://github.com/ChristopheTauziet/manager-dashboard)"


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def yahoo_price(ticker: str, retries: int = 4) -> float | None:
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        "?interval=1d&range=1d"
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=35) as resp:
                raw = json.load(resp)
            result = raw.get("chart", {}).get("result")
            if not result:
                return None
            meta = result[0].get("meta") or {}
            price = meta.get("regularMarketPrice")
            if price is not None:
                return float(price)
            return None
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, KeyError, IndexError, TypeError) as e:
            last_err = e
            time.sleep(1.5 * (attempt + 1))
    print(f"Warning: Yahoo failed for {ticker}: {last_err}", file=sys.stderr)
    return None


def tradeable_tickers(assets: dict) -> list[str]:
    out: list[str] = []
    for s in assets.get("stocks", []):
        t = s.get("ticker") or ""
        if t.startswith("_"):
            continue
        if s.get("fixedValue") is not None:
            continue
        out.append(t)
    return out


def main() -> int:
    assets = load_json(ASSETS_PATH)
    tickers = tradeable_tickers(assets)
    if not tickers:
        print("No tradeable tickers in assets.json", file=sys.stderr)
        return 1

    prev: dict = {}
    if PRICES_PATH.exists():
        try:
            prev = load_json(PRICES_PATH)
        except json.JSONDecodeError:
            prev = {}

    prices: dict[str, float] = {}
    fresh = 0
    for i, ticker in enumerate(tickers):
        p = yahoo_price(ticker)
        if p is not None:
            prices[ticker] = p
            fresh += 1
        elif ticker in prev:
            prices[ticker] = prev[ticker]
            print(f"Warning: using stale price for {ticker}", file=sys.stderr)
        else:
            print(f"Error: no price for {ticker}", file=sys.stderr)
        if i < len(tickers) - 1:
            time.sleep(0.75)

    if fresh == 0:
        print("Error: could not refresh any ticker from Yahoo", file=sys.stderr)
        return 1

    PRICES_PATH.parent.mkdir(parents=True, exist_ok=True)
    with PRICES_PATH.open("w", encoding="utf-8") as f:
        json.dump(prices, f, indent=2, sort_keys=True)
        f.write("\n")

    print(f"Updated {len(prices)} symbols ({fresh} fresh from Yahoo)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
