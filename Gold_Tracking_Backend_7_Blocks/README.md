# Gold Tracking — 7 Stage Blockchain Prototype

Project: **Blockchain-Based End-to-End Gold Tracking System Using Smart Tracking**

This prototype follows the project's Mine-to-Finger lifecycle:

1. Mining
2. Transport
3. Refining
4. Hallmarking
5. Private Agency / Melting
6. Manufacturing
7. Final HUID Verification

## Remix-first setup

### 1. Compile
Open `contracts/GoldTracking.sol` in Remix and compile with Solidity **0.8.24**.

The contract has been rewritten to avoid the previous **Stack too deep** error. No `viaIR` or optimizer setting is required for the contract design.

### 2. Deploy
For a blockchain + UI demonstration, use:

**Deploy & Run Transactions → Injected Provider - MetaMask → Deploy**

Copy the deployed contract address.

### 3. Use the professional UI
Open `frontend/index.html` with VS Code Live Server.

Connect MetaMask, paste the contract address, and use the dashboard.

The UI provides:
- Light / dark theme
- Wallet connection
- Seven-stage lifecycle dashboard
- Stage registration forms
- Batch history timeline
- Mass-balance rejection feedback from the smart contract
- HUID verification certificate view
- Responsive layout

## Example demonstration

Batch: `GOLD-2026-001`

- Mining: 1000 g
- Transport: 1000 g
- Refining: 980 g, 99.50%
- Hallmarking: 980 g, 99.50%
- Melting: 950 g
- Manufacturing: 300 g
- Final HUID: `HUID-2026-0001`

### Fraud test
After the melting stage has 950 g available, try registering manufacturing output above 950 g. The smart contract should reject it with:

`Mass Balance Violation: output exceeds available certified gold`

## Optional Node.js backend

The `src/` and Hardhat files remain available if you want to use the REST API later. The Remix + MetaMask + frontend flow is the simplest demonstration path for Phase 1.
