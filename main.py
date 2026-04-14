from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="LiveCryptoIn API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

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
