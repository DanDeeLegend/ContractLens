# ContractLens

Decode the events a smart contract emits on **Ethereum Sepolia** into a readable activity feed. Paste a contract address (or try the demo contract) and see each event's name, decoded parameters, caller, block, gas used and transaction hash.

Think of it as a lightweight, single-contract alternative to a block explorer.

**Live demo:** https://contract-lens-two.vercel.app

## How it works

```
 Browser (React)                    Vercel Function                 Provider
┌────────────────────┐   POST     ┌──────────────────────┐  POST  ┌──────────────┐
│ ethers.js provider ├───────────►│  /api/rpc  (proxy)   ├───────►│ Alchemy etc. │
│ log scanner        │ same-origin│  allowlist, limits,  │ RPC_URL│  (Sepolia)   │
│ ABI decoder        │◄───────────┤  key stays here      │◄───────┤              │
└────────────────────┘            └──────────────────────┘        └──────────────┘
```

1. **Scan.** `logScanner` walks back from the chain tip in block windows, collecting `eth_getLogs` results until it has enough events. Providers cap the range per call (Alchemy's free tier allows 10 blocks), so the scanner starts wide and shrinks to whatever the provider says it accepts.
2. **Decode.** Each log's first topic is its Keccak-256 event-signature hash. `decoderService` matches it against the ABI (standard ERC-20, Ownable and Pausable events by default), then decodes indexed parameters from the topics and non-indexed ones from the ABI-encoded data. Unknown events are kept and labelled "Unknown" rather than hidden.
3. **Enrich.** The caller, status and gas come from the transaction and its receipt; the timestamp from the block. These are looked up once per transaction/block and cached.

### Why a server-side proxy?

Vite bundles every `VITE_*` variable into public JavaScript, so an RPC URL stored that way is readable by anyone with dev tools, and your quota can be burned by anyone. Instead the browser only ever talks to this app's own `/api/rpc`, and the key lives in a server-only environment variable (`RPC_URL`).

The proxy ([`api/rpc.ts`](api/rpc.ts)) also limits what that endpoint can be used for:

- read-only **method allowlist** (no sending transactions, no debug/trace/admin methods)
- **same-origin only** (cross-site browsers are refused)
- small request bodies, small batches, and **bounded `eth_getLogs` ranges** (a single contract address is required)
- best-effort per-IP **rate limit** (serverless instances don't share memory, so also add a rate-limit rule in the Vercel Firewall for a hard limit)
- the provider URL and key are **scrubbed** from anything relayed back, and upstream failures return a generic error

## Run it locally

```bash
npm install
cp .env.example .env      # then fill in RPC_URL and VITE_CONTRACT_ADDRESS
npm run dev
```

`npm run dev` serves the proxy at `/api/rpc` too (see `vite.config.ts`), so local development behaves like production.

| Variable | Where | Purpose |
|---|---|---|
| `RPC_URL` | server only | Sepolia JSON-RPC endpoint, e.g. `https://eth-sepolia.g.alchemy.com/v2/<key>`. **Never prefix with `VITE_`.** |
| `ALLOWED_ORIGINS` | server only, optional | Extra origins allowed to call `/api/rpc` (comma separated). |
| `VITE_CONTRACT_ADDRESS` | public | Contract used by the landing page's "Try Demo Contract" button. |

## Deploy on Vercel

1. Import the repo. Vercel detects Vite and picks up `api/rpc.ts` automatically.
2. Add `RPC_URL` under *Project Settings → Environment Variables* (do **not** add it with a `VITE_` prefix). Optionally set `VITE_CONTRACT_ADDRESS`.
3. Recommended: add a **rate-limit rule** in *Firewall* for `/api/rpc`.
4. In your RPC provider's dashboard, rotate any key that was ever exposed through a `VITE_` variable (older versions of this app did that).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with the RPC proxy |
| `npm run build` | Typecheck and production build |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | Oxlint |

## Tests

34 unit tests cover the parts where bugs would be expensive:

- **RPC proxy** (`tests/rpcProxy.test.ts`): method allowlist, cross-origin refusal, body and batch limits, `eth_getLogs` bounds, key scrubbing (including when an upstream echoes the key), generic upstream errors, fail-closed when unconfigured, rate limiting.
- **Log scanner** (`tests/logScanner.test.ts`): newest-first collection, early stop, adapting to a 10-block provider limit, halving on unnamed range errors, genuine failures surfacing, call caps.
- **Decoder** (`tests/decoder.test.ts`): indexed and non-indexed parameters, signature-hash matching, unknown and malformed logs.

## Limitations

- **Events, not every call.** Data comes from event logs. A transaction that reverts emits no logs, so reverted transactions don't appear (the "Failed" filter will normally be empty). A contract that emits no events for an action won't show that action.
- **Recent history, not a live stream.** It scans the most recent blocks (up to 2,000 lookback, stopping once it has 50 events) and refreshes on demand; it doesn't subscribe to new blocks.
- **Default ABI.** Decoding covers standard ERC-20, Ownable and Pausable events. Other events show as "Unknown" until you supply an ABI.
- **Provider limits apply.** On Alchemy's free tier each `eth_getLogs` call covers 10 blocks, so a scan takes many small requests.

## Project structure

```
api/rpc.ts                    Vercel Function: server-side JSON-RPC proxy
src/services/rpcService.ts    ethers provider pointed at /api/rpc
src/services/logScanner.ts    windowed eth_getLogs that adapts to provider limits
src/services/decoderService.ts  log → event name + typed parameters
src/services/blockchainService.ts  composes the above into Transaction[]
src/hooks/useContractActivity.ts   shared loading/error/data state for all pages
src/pages, src/components     UI (React 19, Tailwind 4)
tests/                        Vitest suites
```

Built with React, TypeScript, Vite, Tailwind, ethers.js v6 and a Vercel Function.
