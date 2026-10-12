# Gold Tracking System

> **Final Year Project: Blockchain-Based End-to-End Gold Tracking System Using Smart Tracking**
> 
> *A transparent, immutable, and fraud-resistant provenance tracking platform covering the complete "Mine-to-Finger" lifecycle.*

---

## 🌟 Overview

The **Gold Tracking System** is a decentralized provenance and mass-balance conservation tracking solution implemented on Ethereum/EVM-compatible smart contracts. It tracks gold batches through every critical step of transformation and custody transfer:

1. **⛏ Mining Origin**: Logs initial ore extraction, mining concession permits, and batch creation.
2. **🚚 Secure Transport**: Custody transfers, GPS checkpoints, and tamper-evident security seals.
3. **⚗ Smelting & Refining**: Chemical assay purity testing and basis point grade certification.
4. **🔬 BIS / Hallmarking**: Regulatory verification, assay certification, and hallmark stamping.
5. **🔥 Agency / Melting**: Weight consolidation, bar-casting, and purity recalibration.
6. **💍 Manufacturing**: Transformation into finished ornaments, rings, necklaces, or coins.
7. **✅ Final Verification & HUID**: Issuance and verification of Hallmark Unique Identification (HUID) consumer certificates.

---

## 🛡 Key Features

- **Mass-Balance Violation Prevention**: The smart contract mathematically enforces conservation of mass, preventing fraudulent injection of unregistered or illicit gold into the supply chain.
- **Interactive 3D WebGL Provenance Studio (Three.js)**:
  - Procedural 3D Gold Bullion Ingot with PBR metallic reflections and serial engravings.
  - 7-Stage Orbital Constellation with animated particle beams and raycast interactivity.
- **Web3 & MetaMask Integration**: Direct smart contract invocation with fallback prototype preview mode.
- **Luxury HUID Digital Certificate**: Vector QR verification and high-security certificate layout with guilloche borders and cryptographic hashes.
- **Fraud Simulator**: Live testing mechanism demonstrating contract reverts upon weight inflation.

---

## 📁 Repository Structure

```
gold-tracking-system/
├── package.json                 # Root script runner
├── remix.config.json            # Remix IDE workspace configuration
└── Gold_Tracking_Backend_7_Blocks/
    ├── contracts/
    │   └── GoldTracking.sol     # Core Ethereum smart contract
    ├── frontend/                # Interactive 3D WebGL & Web3 Dashboard
    │   ├── index.html           # Main UI entry point
    │   ├── styles.css           # Luxury Gold obsidian & royal pearl styles
    │   ├── app.js               # Application logic & contract interaction
    │   └── three-scene.js       # Three.js 3D Bullion & Constellation canvas
    ├── scripts/
    │   └── deploy.js            # Hardhat deployment script
    ├── src/                     # Node.js Express REST API backend
    │   ├── server.js            # Express server
    │   ├── blockchain.js        # Ethers.js blockchain wrapper
    │   └── config.js            # Configuration loader
    ├── test/
    │   └── GoldTracking.test.js # Smart contract automated test suite
    ├── hardhat.config.js        # Hardhat configuration
    ├── package.json             # Backend & Hardhat dependencies
    └── postman_collection.json  # Postman API testing collection
```

---

## 🚀 Quick Start

### Option 1: Frontend & MetaMask (Remix-first flow)

1. Open `Gold_Tracking_Backend_7_Blocks/contracts/GoldTracking.sol` in [Remix IDE](https://remix.ethereum.org).
2. Compile with Solidity **0.8.24**.
3. Deploy using **Injected Provider - MetaMask**.
4. Open `Gold_Tracking_Backend_7_Blocks/frontend/index.html` in your browser (or using Live Server).
5. Paste your deployed contract address and connect MetaMask.

### Option 2: Node.js Backend & Local Hardhat

1. Install dependencies:
   ```bash
   cd Gold_Tracking_Backend_7_Blocks
   npm install
   ```
2. Start the local server:
   ```bash
   npm start
   ```
3. Visit `http://localhost:5000` in your browser.

---

## 📜 Smart Contract Lifecycle & Rules

The smart contract [`GoldTracking.sol`](file:///c:/Users/Siri%20Manjunatha%20Wodi/Downloads/Gold_Tracking_Backend_7_Blocks_v2/Gold_Tracking_Backend_7_Blocks/contracts/GoldTracking.sol) enforces:
- Sequential stage transitions (cannot skip from Mining directly to Hallmarking).
- Mass-balance conservation: output weight must not exceed certified input weight.
- Purity assay basis points (e.g., 9950 = 99.50% fine gold).
- Cryptographic hashing of each block linked to its parent block id.
