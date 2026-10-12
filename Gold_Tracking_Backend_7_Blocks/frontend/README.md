# Aurum Trace 3D — Next-Gen Blockchain Gold Provenance UI

Unique, professional, neat, and clean 3D UI/UX for the 7-Stage "Mine-to-Finger" Gold Tracking Smart Contract.

## Features

- **Interactive 3D WebGL Studio (Three.js)**:
  - Procedural 3D Gold Bullion Ingot with realistic gold PBR metallic materials and authentic serial engravings.
  - 7-Stage Orbital Constellation with glowing particle beams and animated stage spheres.
  - Interactive Raycaster: Click or hover on any 3D node to inspect and sync with the stage registration studio.
  - Camera modes: Constellation View, Bullion View, and 7-Stage Orbit View with auto-rotation.
- **7-Stage Lifecycle Dashboard**:
  - Interactive stage milestone cards displaying weights, purity assays, ledger block IDs, and hashes.
  - Live Mass-Balance Conservation Flow indicator tracking yield from ore extraction to finished jewelry.
- **Smart Stage Registration Studio**:
  - Pre-fill sample values with 1-click for instant evaluation.
  - Enforces client-side and on-chain mass-balance verification to prevent illicit gold dilution.
  - Dual Mode: Full Web3 MetaMask contract interaction with graceful prototype fallback.
- **Luxury HUID Digital Certificate & QR Verification**:
  - Verification portal for Hallmark Unique ID (HUID).
  - High-luxury digital certificate with guilloche ornamental borders, holographic shimmer, and crisp vector QR code.
- **Mass-Balance Fraud Simulator**:
  - Live demonstration showing how the smart contract halts illegal output weight inflation.
- **Theme System**:
  - Deep Obsidian Gold (Dark Mode) & Royal Pearl (Light Mode).

## How to Run

1. Open [`frontend/index.html`](file:///c:/Users/Siri%20Manjunatha%20Wodi/Downloads/Gold_Tracking_Backend_7_Blocks_v2/Gold_Tracking_Backend_7_Blocks/frontend/index.html) with VS Code Live Server, or run the Node.js backend:
   ```bash
   cd Gold_Tracking_Backend_7_Blocks
   npm start
   ```
   and navigate to `http://localhost:5000`.
2. Click **Quick Demo Data** in the top bar to instantly test all 7 stages and view the HUID certificate.
3. To connect MetaMask, deploy [`contracts/GoldTracking.sol`](file:///c:/Users/Siri%20Manjunatha%20Wodi/Downloads/Gold_Tracking_Backend_7_Blocks_v2/Gold_Tracking_Backend_7_Blocks/contracts/GoldTracking.sol) in Remix using **Injected Provider - MetaMask**, copy the deployed address, paste it into the contract settings card, and save.
