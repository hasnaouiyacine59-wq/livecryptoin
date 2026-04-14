# LiveCryptoIn API

Realtime DEX data API for multichain: Ethereum, BNB Chain, Polygon, Avalanche, Fantom, Arbitrum, Cronos, Optimism, Base, Solana.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/chains` | Supported chains |
| GET | `/chart/{chain}/{pool_address}` | OHLCV candlestick data |
| GET | `/trades/{chain}/{pool_address}` | Recent trades |
| GET | `/token/{chain}/{address}` | Token info, price, volume |
| GET | `/pairs/{chain}/{address}` | All pairs for a token |
| GET | `/search?q=` | Search tokens/pairs |
| GET | `/portfolio/{chain}/{wallet}` | Wallet token info |
| GET | `/swap/chains` | Chains supported for swap |
| GET | `/swap/tokens?chain=` | Tokens available for swap |
| GET | `/swap/quote` | Get swap/bridge quote |

## Chart Example

```
GET /chart/bsc/0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE?timeframe=hour&limit=100
```

## Swap Quote Example

```
GET /swap/quote?from_chain=56&to_chain=1&from_token=0x...&to_token=0x...&from_amount=1000000000000000000&from_address=0x...
```

## Deploy on Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your repo — `render.yaml` handles the rest

## Run Locally

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Docs at: http://localhost:8000/docs

## Data Sources

- [GeckoTerminal](https://www.geckoterminal.com/api) — OHLCV, trades (free, no key)
- [DexScreener](https://docs.dexscreener.com) — token/pair info (free, no key)
- [LiFi](https://li.quest) — swap/bridge aggregator (free, no key)
