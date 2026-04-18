from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import httpx, os, time, asyncio

app = FastAPI(title="LiveCryptoIn API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

if os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

GECKO = "https://api.geckoterminal.com/api/v2"
DEXSCREENER_V1 = "https://api.dexscreener.com"
DEXSCREENER = "https://api.dexscreener.com/latest/dex"
LIFI = "https://li.quest/v1"

CHAINS = {
    "ethereum": "eth", "bsc": "bsc", "polygon": "polygon_pos",
    "avalanche": "avax", "fantom": "ftm", "arbitrum": "arbitrum",
    "cronos": "cro", "optimism": "optimism", "base": "base", "solana": "solana",
}

# ── Simple TTL cache ────────────────────────────────────────────────────────
_cache: dict = {}

def _cache_get(key: str, ttl: int):
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < ttl:
        return entry["data"]
    return None

def _cache_set(key: str, data):
    _cache[key] = {"ts": time.time(), "data": data}

# ── HTTP helpers ────────────────────────────────────────────────────────────
async def get(url: str, params: dict = None):
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params)
        if r.status_code == 429:
            raise HTTPException(429, "Upstream rate limit hit — try again in a few seconds")
        if r.status_code != 200:
            raise HTTPException(r.status_code, r.text[:300])
        return r.json()

async def get_cached(url: str, params: dict = None, ttl: int = 60):
    """Fetch with TTL cache. Default 60s — keeps GeckoTerminal well under 10/min."""
    key = url + str(sorted((params or {}).items()))
    cached = _cache_get(key, ttl)
    if cached is not None:
        return cached
    data = await get(url, params)
    _cache_set(key, data)
    return data

# ── Routes ──────────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
def root():
    try:
        with open("static/index.html") as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>LiveCryptoIn API</h1><p><a href='/docs'>Docs</a></p>"

@app.get("/chains")
def chains():
    return CHAINS

@app.get("/chart/{chain}/{pool_address}")
async def chart(
    chain: str, pool_address: str,
    timeframe: str = Query("hour", enum=["minute", "hour", "day"]),
    aggregate: int = Query(1),
    limit: int = Query(100, le=1000),
):
    """OHLCV candlestick data — cached 60s (GeckoTerminal: 10 req/min free)."""
    network = CHAINS.get(chain.lower())
    if not network:
        raise HTTPException(400, f"Unsupported chain. Use: {list(CHAINS)}")
    return await get_cached(
        f"{GECKO}/networks/{network}/pools/{pool_address}/ohlcv/{timeframe}",
        {"aggregate": aggregate, "limit": limit, "currency": "usd"},
        ttl=60,
    )

@app.get("/trades/{chain}/{pool_address}")
async def trades(chain: str, pool_address: str):
    """Recent trades — cached 15s."""
    network = CHAINS.get(chain.lower())
    if not network:
        raise HTTPException(400, f"Unsupported chain. Use: {list(CHAINS)}")
    return await get_cached(
        f"{GECKO}/networks/{network}/pools/{pool_address}/trades",
        ttl=15,
    )

@app.get("/token/{chain}/{address}")
async def token_info(chain: str, address: str):
    """Token info via DexScreener v1 (300 req/min) — cached 20s."""
    return await get_cached(
        f"{DEXSCREENER_V1}/tokens/v1/{chain}/{address}",
        ttl=20,
    )

@app.get("/pairs/{chain}/{address}")
async def pairs(chain: str, address: str):
    """All pairs for a token — DexScreener v1, cached 20s."""
    return await get_cached(
        f"{DEXSCREENER_V1}/token-pairs/v1/{chain}/{address}",
        ttl=20,
    )

@app.get("/search")
async def search(q: str = Query(..., min_length=2)):
    """Search tokens/pairs — DexScreener (300 req/min), cached 30s."""
    return await get_cached(f"{DEXSCREENER}/search", {"q": q}, ttl=30)

@app.get("/trending")
async def trending():
    """Trending token metas from DexScreener — cached 60s."""
    return await get_cached(f"{DEXSCREENER_V1}/metas/trending/v1", ttl=60)

@app.get("/portfolio/{chain}/{wallet}")
async def portfolio(chain: str, wallet: str):
    """Token pairs associated with a wallet/token address — cached 30s."""
    if chain.lower() not in CHAINS:
        raise HTTPException(400, f"Unsupported chain. Use: {list(CHAINS)}")
    return await get_cached(
        f"{DEXSCREENER_V1}/tokens/v1/{chain}/{wallet}",
        ttl=30,
    )

@app.get("/swap/chains")
async def swap_chains():
    """Supported chains for swaps via LiFi — cached 10min."""
    return await get_cached(f"{LIFI}/chains", ttl=600)

@app.get("/swap/tokens")
async def swap_tokens(chain: int = Query(...)):
    """Tokens available for swap on a chain — cached 5min."""
    return await get_cached(f"{LIFI}/tokens", {"chains": chain}, ttl=300)

@app.get("/swap/quote")
async def swap_quote(
    from_chain: int = Query(...), to_chain: int = Query(...),
    from_token: str = Query(...), to_token: str = Query(...),
    from_amount: str = Query(...), from_address: str = Query(...),
):
    """Live swap/bridge quote via LiFi — not cached (user-specific)."""
    return await get(f"{LIFI}/quote", {
        "fromChain": from_chain, "toChain": to_chain,
        "fromToken": from_token, "toToken": to_token,
        "fromAmount": from_amount, "fromAddress": from_address,
    })
