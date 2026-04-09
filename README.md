# SplitPay - INITIATE Hackathon Submission 🚀

**SplitPay** is an EVM-based Initia Appchain designed to let users easily split native token payments across multiple recipients, while automatically generating protocol revenue via a built-in platform fee mechanism. 

Built exclusively for the **INITIATE: The Initia Hackathon (Season 1)** under the **DeFi** track.

## 🌟 Hackathon Requirements Checklist

- ✅ **Focus on App & Revenue Generation:** The SplitPay protocol applies a configurable platform fee (default 2%) on every transaction, instantly capturing value on the chain. No value leaks, pure native economics.
- ✅ **Initia-Native Features Integrated:**
  1. **Initia Usernames (.init):** Send splits by typing `@username.init` instead of messy `0x...` addresses!
  2. **Interwoven Bridge:** Users can instantly bridge assets directly on the top header of the web application.
- ✅ **InterwovenKit Integration:** Strictly uses `@initia/interwovenkit-react` for all UI wallet connectivity and deep transaction submission handling (`requestTxBlock`).
- ✅ **Appchain Deployed:** Fully tested and deployed on a local `minitiad` EVM instance. Rollup ID: `splitpay-rollup-1`.
- ✅ **Metadata Compliant:** `.initia/submission.json` is provided.

## 🛠 Product Value & Features
- **One-Click Multi-Sends**: Splitting a dinner bill or protocol revenue to 15 people? Send it all in a single, gas-efficient on-chain click.
- **Auto-Bech32 Resolution**: Enter native Initia `init1...` addresses or `@username.init` directly in the EVM UI. The dApp automatically resolves and translates this to standard hex `0x` format for the EVM backend under the hood.
- **Institutional UI/UX**: Premium "Cyber-Fintech" dark-mode interface built on Next.js 16 and Tailwind v4. It doesn't look like a standard hackathon side-project; it looks ready for market.

## 💻 Tech Stack
- **Smart Contracts**: Solidity 0.8.26, Foundry, OpenZeppelin v5
- **Frontend**: Next.js 16, React 19, TypeScript
- **Initia Tooling**: `minitiad` (EVM local Appchain), InterwovenKit, viem/wagmi v2

## 🚀 How to Run Locally

### 1. Smart Contract (Backend)
Ensure you have a local EVM Initia Rollup running on Port `8545`.
Deploy the contract:
```bash
cd splitpay-contract
forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --broadcast
```

### 2. Frontend
```bash
cd splitpay-frontend
pnpm install
pnpm dev
```
Navigate to `http://localhost:3000` to interact with SplitPay.

---
*Submitted for INITIATE Hackathon 2026.*
