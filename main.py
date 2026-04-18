from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import httpx
import os

app = FastAPI(title="LiveCryptoIn API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

if os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

GECKO = "https://api.geckoterminal.com/api/v2"
DEXSCREENER = "https://api.dexscreener.com/latest/dex"
LIFI = "https://li.quest/v1"

CHAINS = {
    "ethereum": "eth",
    "bsc": "bsc",
    "polygon": "polygon_pos",
    "avalanche": "avax",
    "fantom": "ftm",
    "arbitrum": "arbitrum",
    "cronos": "cro",
    "optimism": "optimism",
    "base": "base",
    "solana": "solana",
}

async def get(url: str, params: dict = None):
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return r.json()


@app.get("/", response_class=HTMLResponse)
def root():
    try:
        with open("static/index.html") as f:
            return f.read()
    except FileNotFoundError:
        pass
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LiveCryptoIn API</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; min-height: 100vh; padding: 40px 20px; }
  h1 { font-size: 2rem; color: #58a6ff; margin-bottom: 8px; }
  p.sub { color: #8b949e; margin-bottom: 32px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; max-width: 960px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 18px; }
  .card h3 { font-size: 0.85rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .card code { display: block; font-size: 0.9rem; color: #79c0ff; word-break: break-all; margin-bottom: 8px; }
  .card p { font-size: 0.85rem; color: #8b949e; }
  .badge { display: inline-block; background: #238636; color: #fff; font-size: 0.7rem; padding: 2px 8px; border-radius: 20px; margin-bottom: 10px; }
  a.docs { display: inline-block; margin-top: 32px; background: #238636; color: #fff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  a.docs:hover { background: #2ea043; }
</style>
</head>
<body>
<h1>⚡ LiveCryptoIn API</h1>
<p class="sub">Realtime DEX data for Ethereum, BNB Chain, Polygon, Avalanche, Fantom, Arbitrum, Cronos, Optimism, Base, Solana.</p>
<div class="grid">
  <div class="card"><span class="badge">GET</span><h3>Chains</h3><code>/chains</code><p>List all supported chains.</p></div>
  <div class="card"><span class="badge">GET</span><h3>Chart</h3><code>/chart/{chain}/{pool}</code><p>OHLCV candlestick data for a pool.</p></div>
  <div class="card"><span class="badge">GET</span><h3>Trades</h3><code>/trades/{chain}/{pool}</code><p>Recent trades for a pool.</p></div>
  <div class="card"><span class="badge">GET</span><h3>Token Info</h3><code>/token/{chain}/{address}</code><p>Token price, volume, liquidity.</p></div>
  <div class="card"><span class="badge">GET</span><h3>Pairs</h3><code>/pairs/{chain}/{address}</code><p>All trading pairs for a token.</p></div>
  <div class="card"><span class="badge">GET</span><h3>Search</h3><code>/search?q=</code><p>Search tokens or pairs by name/address.</p></div>
  <div class="card"><span class="badge">GET</span><h3>Portfolio</h3><code>/portfolio/{chain}/{wallet}</code><p>Wallet token info.</p></div>
  <div class="card"><span class="badge">GET</span><h3>Swap Chains</h3><code>/swap/chains</code><p>Chains supported for swapping.</p></div>
  <div class="card"><span class="badge">GET</span><h3>Swap Tokens</h3><code>/swap/tokens?chain=</code><p>Tokens available for swap on a chain.</p></div>
  <div class="card"><span class="badge">GET</span><h3>Swap Quote</h3><code>/swap/quote</code><p>Get a swap/bridge quote via LiFi.</p></div>
</div>
<a class="docs" href="/docs">📖 Interactive Docs (Swagger)</a>
</body>
</html>"""


@app.get("/chains")
def chains():
    return CHAINS


@app.get("/chart/{chain}/{pool_address}")
async def chart(
    chain: str,
    pool_address: str,
    timeframe: str = Query("hour", enum=["minute", "hour", "day"]),
    aggregate: int = Query(1),
    limit: int = Query(100, le=1000),
):
    """OHLCV candlestick data for a pool."""
    network = CHAINS.get(chain.lower())
    if not network:
        raise HTTPException(400, f"Unsupported chain. Use: {list(CHAINS)}")
    data = await get(
        f"{GECKO}/networks/{network}/pools/{pool_address}/ohlcv/{timeframe}",
        {"aggregate": aggregate, "limit": limit, "currency": "usd"},
    )
    return data


@app.get("/trades/{chain}/{pool_address}")
async def trades(chain: str, pool_address: str):
    """Recent trades for a pool."""
    network = CHAINS.get(chain.lower())
    if not network:
        raise HTTPException(400, f"Unsupported chain. Use: {list(CHAINS)}")
    return await get(f"{GECKO}/networks/{network}/pools/{pool_address}/trades")


@app.get("/token/{chain}/{address}")
async def token_info(chain: str, address: str):
    """Token info, price, volume, liquidity from DexScreener."""
    return await get(f"{DEXSCREENER}/tokens/{address}")


@app.get("/pairs/{chain}/{address}")
async def pairs(chain: str, address: str):
    """All pairs for a token on a specific chain."""
    return await get(f"{DEXSCREENER}/pairs/{chain}/{address}")


@app.get("/search")
async def search(q: str = Query(..., min_length=2)):
    """Search tokens/pairs by name or address."""
    return await get(f"{DEXSCREENER}/search", {"q": q})


@app.get("/portfolio/{chain}/{wallet}")
async def portfolio(chain: str, wallet: str):
    """
    Wallet token balances via GeckoTerminal (no key needed).
    Note: GeckoTerminal doesn't expose wallet balances — returns top pools
    for the chain as a fallback. For real portfolio data, add a Moralis key.
    """
    network = CHAINS.get(chain.lower())
    if not network:
        raise HTTPException(400, f"Unsupported chain. Use: {list(CHAINS)}")
    # DexScreener wallet endpoint (public, no key)
    return await get(f"https://api.dexscreener.com/latest/dex/tokens/{wallet}")


@app.get("/swap/chains")
async def swap_chains():
    """Supported chains for swaps via LiFi."""
    return await get(f"{LIFI}/chains")


@app.get("/swap/tokens")
async def swap_tokens(chain: int = Query(...)):
    """Tokens available for swap on a chain (LiFi chain ID)."""
    return await get(f"{LIFI}/tokens", {"chains": chain})


@app.get("/swap/quote")
async def swap_quote(
    from_chain: int = Query(...),
    to_chain: int = Query(...),
    from_token: str = Query(...),
    to_token: str = Query(...),
    from_amount: str = Query(...),
    from_address: str = Query(...),
):
    """Get a swap/bridge quote via LiFi aggregator."""
    return await get(f"{LIFI}/quote", {
        "fromChain": from_chain,
        "toChain": to_chain,
        "fromToken": from_token,
        "toToken": to_token,
        "fromAmount": from_amount,
        "fromAddress": from_address,
    })
