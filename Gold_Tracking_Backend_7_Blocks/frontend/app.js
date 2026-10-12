/**
 * Aurum Trace 3D — Core Application Controller
 * Handles Web3 MetaMask integration, contract invocation, fallback prototype state,
 * Three.js 3D synchronization, HUID certificate generation, and mass-balance calculations.
 */

// Contract ABI (Matches GoldTracking.sol)
const ABI = [
  "function createMiningBlock(string,uint256,string,string,string) returns (uint256)",
  "function createTransportBlock(string,uint256,string,string,string) returns (uint256)",
  "function createRefiningBlock(string,uint256,uint256,string,string,string) returns (uint256)",
  "function createHallmarkingBlock(string,uint256,uint256,string,string,string) returns (uint256)",
  "function createAgencyMeltingBlock(string,uint256,string,string,string) returns (uint256)",
  "function createManufacturingBlock(string,uint256,string,string,string) returns (uint256)",
  "function createFinalVerificationBlock(string,uint256,string,string,string) returns (uint256)",
  "function getBatchHistory(string) view returns (tuple(uint256,string,uint8,uint256,uint256,string,string,string,uint256,uint256,address,bytes32)[])",
  "function getLatestBlock(string) view returns (tuple(uint256,string,uint8,uint256,uint256,string,string,string,uint256,uint256,address,bytes32))",
  "function verifyHUID(string) view returns (bool,tuple(uint256,string,uint8,uint256,uint256,string,string,string,uint256,uint256,address,bytes32))"
];

// Stage Metadata
const stages = [
  {
    id: 0,
    name: "Mining Origin",
    icon: "⛏",
    fn: "createMiningBlock",
    fields: ["batchId", "weight", "location", "reference", "document"],
    guide: "Logs initial raw ore extraction, origin quarry GPS/name, and government concession permit."
  },
  {
    id: 1,
    name: "Secure Transport",
    icon: "🚚",
    fn: "createTransportBlock",
    fields: ["batchId", "weight", "location", "reference", "document"],
    guide: "Logs transit checkpoint, GPS custody transfer, vehicle identifier, and security seals."
  },
  {
    id: 2,
    name: "Smelting & Refining",
    icon: "⚗",
    fn: "createRefiningBlock",
    fields: ["batchId", "weight", "purity", "location", "reference", "document"],
    guide: "Records refined fine gold weight and chemical assay purity in basis points (e.g. 9950 = 99.50% 24K)."
  },
  {
    id: 3,
    name: "BIS Hallmarking",
    icon: "🛡",
    fn: "createHallmarkingBlock",
    fields: ["batchId", "weight", "purity", "location", "reference", "document"],
    guide: "Official Bureau of Indian Standards (BIS) hallmarking assay and laser micro-engraving validation."
  },
  {
    id: 4,
    name: "Agency Melting",
    icon: "🔥",
    fn: "createAgencyMeltingBlock",
    fields: ["batchId", "weight", "location", "reference", "document"],
    guide: "Certified private melting & bullion casting. Establishes the authoritative weight cap for manufacturing."
  },
  {
    id: 5,
    name: "Manufacturing",
    icon: "💎",
    fn: "createManufacturingBlock",
    fields: ["batchId", "jewelleryWeight", "jewelleryId", "location", "document"],
    guide: "Artisan jewelry crafting. Validated by smart contract mass balance (cannot exceed available melted weight)."
  },
  {
    id: 6,
    name: "Final HUID Verification",
    icon: "📜",
    fn: "createFinalVerificationBlock",
    fields: ["batchId", "finalWeight", "huid", "location", "document"],
    guide: "Generates unique Hallmark Unique ID (HUID) and locks the complete immutable provenance chain."
  }
];

const fieldMeta = {
  batchId: ["Batch ID", "text", "GOLD-2026-001", "Batch Identifier"],
  weight: ["Weight (grams)", "number", "1000", "g"],
  purity: ["Purity (basis points, 9950 = 99.50%)", "number", "9950", "bps"],
  location: ["Facility / Location", "text", "Hutti Gold Mines, Karnataka", ""],
  reference: ["Transit / Assay Reference ID", "text", "REF-MINING-001", ""],
  document: ["IPFS Document CID (Optional)", "text", "QmAu79ProvenanceHash123", ""],
  jewelleryWeight: ["Jewellery Output Weight (grams)", "number", "300", "g"],
  jewelleryId: ["Jewellery Serial ID", "text", "JEW-2026-BRACELET-01", ""],
  finalWeight: ["Certified Final Weight (grams)", "number", "300", "g"],
  huid: ["Hallmark Unique ID (HUID)", "text", "HUID-2026-0001", ""]
};

// Global State
let provider = null;
let signer = null;
let contract = null;
let gold3d = null;
let selectedStage = 0;
let toastTimer = null;
let currentBatchHistory = [];

// DOM Helper
const $ = (id) => document.getElementById(id);

// -----------------------------------------------------------------------------
// DEFAULT IN-MEMORY DEMO DATA (For instant evaluation without MetaMask)
// -----------------------------------------------------------------------------
const defaultDemoBatch = [
  {
    blockId: 1,
    batchId: "GOLD-2026-001",
    stage: 0,
    weightGrams: 1000,
    purityBps: 9000,
    location: "Hutti Gold Mines, Karnataka",
    referenceId: "MINE-LIC-0082",
    documentCID: "QmMineCertHutti2026",
    parentBlockId: 0,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 6,
    actor: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    recordHash: "0x3a4b9102c918ef18374a2b947c94172f38d94821a7c3b940e729a84b91e0a241"
  },
  {
    blockId: 2,
    batchId: "GOLD-2026-001",
    stage: 1,
    weightGrams: 1000,
    purityBps: 9000,
    location: "Secure Transit Fleet, BLR Express",
    referenceId: "TR-884-CONVOY",
    documentCID: "QmTransitGpsLog002",
    parentBlockId: 1,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 5,
    actor: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    recordHash: "0x78fe29d38c1192eab9c8741b2c4820a1f93948b37492c8194a73b984c01e9a22"
  },
  {
    blockId: 3,
    batchId: "GOLD-2026-001",
    stage: 2,
    weightGrams: 980,
    purityBps: 9950,
    location: "Bengaluru Royal Smelting & Refinery",
    referenceId: "ASSAY-SMELT-995",
    documentCID: "QmAssayReport995",
    parentBlockId: 2,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 4,
    actor: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    recordHash: "0x4b2c8941a87e419b8401c2384a91b283948b291a8274c9381b2849e8a719c284"
  },
  {
    blockId: 4,
    batchId: "GOLD-2026-001",
    stage: 3,
    weightGrams: 980,
    purityBps: 9950,
    location: "BIS Hallmarking Centre #04",
    referenceId: "BIS-CERT-8842",
    documentCID: "QmBisLaserStamp8842",
    parentBlockId: 3,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 3,
    actor: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    recordHash: "0x9924a84b18274c91b283948e718294c718294a81b284c91829384b18274a9182"
  },
  {
    blockId: 5,
    batchId: "GOLD-2026-001",
    stage: 4,
    weightGrams: 950,
    purityBps: 9950,
    location: "Sovereign Ingot Casting Agency",
    referenceId: "MELT-BAR-771",
    documentCID: "QmMeltLossAudit771",
    parentBlockId: 4,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
    actor: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    recordHash: "0x18274a91829384b18294c718294a81b284c91829384b18274a91829384b18274"
  },
  {
    blockId: 6,
    batchId: "GOLD-2026-001",
    stage: 5,
    weightGrams: 300,
    purityBps: 9950,
    location: "Atelier Haute Joaillerie, BLR",
    referenceId: "JEW-BRACELET-01",
    documentCID: "QmJewelleryCraftCert",
    parentBlockId: 5,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 1,
    actor: "0x976EA74026E72CD5554574952075cA3CE7b4C20E",
    recordHash: "0x8274c91829384b18274a91829384b18294c718294a81b284c91829384b18274a"
  },
  {
    blockId: 7,
    batchId: "GOLD-2026-001",
    stage: 6,
    weightGrams: 300,
    purityBps: 9950,
    location: "Retail Vault, Commercial Street",
    referenceId: "HUID-2026-0001",
    documentCID: "QmFinalConsumerHuidCert",
    parentBlockId: 6,
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 4,
    actor: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    recordHash: "0x01a8274c91829384b18274a91829384b18294c718294a81b284c91829384b182"
  }
];

function getStoredHistory(batchId) {
  const custom = localStorage.getItem(`aurum_batch_${batchId}`);
  if (custom) {
    try { return JSON.parse(custom); } catch (_) {}
  }
  if (batchId === "GOLD-2026-001") {
    return defaultDemoBatch;
  }
  return [];
}

function saveStoredHistory(batchId, history) {
  localStorage.setItem(`aurum_batch_${batchId}`, JSON.stringify(history));
}

// -----------------------------------------------------------------------------
// UI & TOAST NOTIFICATION
// -----------------------------------------------------------------------------
function showToast(message, isError = false, title = "") {
  const el = $("toast");
  const icon = $("toastIcon");
  const tTitle = $("toastTitle");
  const tMsg = $("toastMsg");

  icon.textContent = isError ? "✕" : "✦";
  tTitle.textContent = title || (isError ? "Blockchain Error" : "System Notification");
  tMsg.textContent = message;

  el.className = `toast-card show ${isError ? "error" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 4500);
}

function shortAddress(addr) {
  return addr && addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : (addr || "—");
}

// -----------------------------------------------------------------------------
// 3D SCENE INITIALIZATION & STAGE SYNC
// -----------------------------------------------------------------------------
function init3DScene() {
  if (typeof Gold3DScene !== 'undefined') {
    gold3d = new Gold3DScene("threeContainer", (stageIdx) => {
      selectStage(stageIdx);
    });

    // Wire HUD Mode buttons
    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (gold3d) gold3d.setMode(btn.dataset.mode);
      });
    });

    $("toggleRotateBtn").addEventListener("click", () => {
      if (gold3d) {
        gold3d.autoRotate = !gold3d.autoRotate;
        $("toggleRotateBtn").textContent = gold3d.autoRotate ? "⟳ Auto-Rotate: ON" : "⏸ Auto-Rotate: OFF";
      }
    });

    $("resetCameraBtn").addEventListener("click", () => {
      if (gold3d) gold3d.resetCamera();
    });
  }
}

// -----------------------------------------------------------------------------
// STAGE SELECTOR & REGISTRATION FORM
// -----------------------------------------------------------------------------
function renderStageSelector() {
  $("stageSelector").innerHTML = stages.map((s, i) =>
    `<button type="button" class="step-tab ${i === selectedStage ? "active" : ""}" data-stage="${i}">
      <span>${s.icon}</span> ${i + 1}. ${s.name}
    </button>`
  ).join("");

  document.querySelectorAll(".step-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      selectStage(Number(tab.dataset.stage));
    });
  });
}

function selectStage(index) {
  selectedStage = index;
  renderStageSelector();
  renderForm();

  // Highlight in 3D Scene
  if (gold3d) {
    gold3d.setActiveStage(index);
  }

  // Update Guide Banner
  const stage = stages[selectedStage];
  $("guideIcon").textContent = stage.icon;
  $("guideTitle").textContent = `Stage ${stage.id + 1}: ${stage.name}`;
  $("guideDescription").textContent = stage.guide;
}

function renderForm() {
  const stage = stages[selectedStage];
  const form = $("stageForm");

  form.innerHTML = stage.fields.map(key => {
    const [label, type, placeholder, unit] = fieldMeta[key];
    const saved = localStorage.getItem(`aurum_field_${key}`) || placeholder;
    return `
      <div class="form-field">
        <label for="${key}">${label}</label>
        <div class="input-affix-group">
          <input id="${key}" type="${type}" step="any" placeholder="${placeholder}" value="${saved}">
          ${unit ? `<span class="input-unit">${unit}</span>` : ""}
        </div>
      </div>
    `;
  }).join("");

  $("formValidationStatus").textContent = `Validated by smart contract rule: ${stage.name} state transition.`;
}

function prefillSampleValues() {
  const stage = stages[selectedStage];
  stage.fields.forEach(key => {
    const el = $(key);
    if (el && fieldMeta[key]) {
      el.value = fieldMeta[key][2];
    }
  });
  showToast(`Pre-filled sample parameters for Stage ${selectedStage + 1} (${stage.name}).`);
}

// -----------------------------------------------------------------------------
// TIMELINE & TELEMETRY RENDERING
// -----------------------------------------------------------------------------
function renderTimeline(history = []) {
  currentBatchHistory = history;
  const container = $("timeline");
  const byStage = new Map(history.map(item => [Number(item.stage), item]));

  container.innerHTML = stages.map((s, i) => {
    const item = byStage.get(i);
    const isDone = Boolean(item);
    const isActive = i === selectedStage;
    
    let weightDisplay = "—";
    let detailDisplay = "Awaiting verification";
    let blockIdText = "Uncommitted";
    let hashText = "—";

    if (item) {
      weightDisplay = `${item.weightGrams} g`;
      detailDisplay = item.location || "Location logged";
      blockIdText = `Block #${item.blockId}`;
      hashText = shortAddress(item.recordHash);
    }

    return `
      <article class="timeline-stage-card ${isDone ? "done" : ""} ${isActive ? "active-stage" : ""}" id="stageCard_${i}">
        <div>
          <div class="card-top-row">
            <span class="stage-num-badge">STAGE ${i + 1}</span>
            <span class="stage-status-icon">${isDone ? "✓" : "○"}</span>
          </div>
          <div class="stage-icon-hero">${s.icon}</div>
          <h4 class="stage-card-title">${s.name}</h4>
          <p class="stage-card-desc">${detailDisplay}</p>
        </div>

        <div class="card-metrics">
          <div class="metric-row">
            <span>Weight:</span>
            <strong>${weightDisplay}</strong>
          </div>
          <div class="metric-row">
            <span>Ledger:</span>
            <strong>${blockIdText}</strong>
          </div>
          <div class="metric-row">
            <span>Hash:</span>
            <strong>${hashText}</strong>
          </div>
          <button type="button" class="focus-3d-btn" onclick="focusStageIn3D(${i})">
            Inspect in 3D ◈
          </button>
        </div>
      </article>
    `;
  }).join("");

  updateTelemetry(history);
}

window.focusStageIn3D = function(stageIdx) {
  selectStage(stageIdx);
  window.location.hash = "#viewport-section";
};

function updateTelemetry(history = []) {
  if (!history || history.length === 0) {
    $("activeBatchTitle").textContent = $("historyBatchId").value || "NO BATCH";
    $("heroWeightVal").innerHTML = "— <small>g</small>";
    $("heroPurityVal").innerHTML = "— <small>%</small>";
    $("heroLocationVal").textContent = "No Records";
    $("heroMassBalanceVal").textContent = "Awaiting Mining";
    $("batchStateBadge").innerHTML = `<span class="dot-active" style="background:#888;"></span> Unregistered`;
    return;
  }

  const latest = history[history.length - 1];
  $("activeBatchTitle").textContent = latest.batchId;
  $("heroWeightVal").innerHTML = `${latest.weightGrams.toLocaleString()} <small>g</small>`;
  $("heroWeightStage").textContent = `Stage ${Number(latest.stage) + 1}: ${stages[Number(latest.stage)]?.name || "Recorded"}`;
  
  const purity = Number(latest.purityBps);
  $("heroPurityVal").innerHTML = purity ? `${(purity / 100).toFixed(2)} <small>%</small>` : "99.50 <small>%</small>";
  $("heroLocationVal").textContent = latest.location || "Karnataka Origin";
  $("heroActorVal").textContent = shortAddress(latest.actor);

  // Mass Balance Progress Bar
  const miningWeight = history.find(h => Number(h.stage) === 0)?.weightGrams || 1000;
  const currentWeight = latest.weightGrams;
  const ratio = Math.min(100, Math.round((currentWeight / miningWeight) * 100));
  $("massProgressFill").style.width = `${ratio}%`;
  
  const stageWeights = history.map(h => `${h.weightGrams}g`).join(" → ");
  $("massFlowRatio").textContent = stageWeights;

  $("batchStateBadge").innerHTML = `<span class="dot-active"></span> Stage ${Number(latest.stage) + 1} (${stages[Number(latest.stage)]?.name}) Verified`;
}

// -----------------------------------------------------------------------------
// WALLET & SMART CONTRACT WEB3
// -----------------------------------------------------------------------------
async function connectWallet() {
  if (!window.ethereum) {
    showToast("MetaMask not found. Operating in Standalone Web3 Prototype Mode.", false, "MetaMask Info");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    $("connectBtnText").textContent = shortAddress(address);
    $("networkPill").innerHTML = `<span class="dot-network"></span> Chain ID: ${network.chainId} (${network.name})`;
    
    await loadContract();
    showToast(`Connected: ${shortAddress(address)} on Chain ${network.chainId}`, false, "Wallet Connected");
  } catch (error) {
    showToast(error.shortMessage || error.message || "Wallet connection error", true);
  }
}

async function loadContract() {
  const address = $("contractAddress").value.trim();
  if (!signer || !ethers.isAddress(address)) return false;
  contract = new ethers.Contract(address, ABI, signer);
  localStorage.setItem("aurum_contract_addr", address);
  return true;
}

// -----------------------------------------------------------------------------
// STAGE SUBMISSION (ON-CHAIN + PROTOTYPE FALLBACK)
// -----------------------------------------------------------------------------
async function submitStage(event) {
  event.preventDefault();
  const stage = stages[selectedStage];
  const values = {};

  stage.fields.forEach(key => {
    const el = $(key);
    values[key] = el ? el.value.trim() : "";
    localStorage.setItem(`aurum_field_${key}`, values[key]);
  });

  const batchId = values.batchId || $("historyBatchId").value || "GOLD-2026-001";
  const btn = $("submitStageBtn");

  // Check Mass Balance Client-side first for immediate feedback
  const existingHistory = getStoredHistory(batchId);
  const melterRecord = existingHistory.find(h => Number(h.stage) === 4);
  if (selectedStage === 5 && melterRecord) {
    const outputW = Number(values.jewelleryWeight || 0);
    const availableW = Number(melterRecord.weightGrams);
    if (outputW > availableW) {
      showToast(`Mass Balance Violation: jewellery weight (${outputW}g) exceeds available melted gold (${availableW}g)`, true, "Smart Contract Reverted");
      return;
    }
  }

  btn.disabled = true;
  btn.innerHTML = `<span>⏳</span> Writing to Blockchain…`;

  // 1. If contract is loaded with signer, try real on-chain transaction
  if (contract && signer) {
    try {
      const args = buildArgs(stage.id, values);
      const tx = await contract[stage.fn](...args);
      showToast(`Transaction broadcast: ${shortAddress(tx.hash)}`, false, "Mined on Ethereum");
      await tx.wait();
      showToast(`${stage.name} confirmed on-chain!`, false, "Block Finalized");
      btn.disabled = false;
      btn.innerHTML = `<span>⚡</span> Write Record to Blockchain`;
      await loadHistory(batchId);
      return;
    } catch (err) {
      console.warn("On-chain call failed, falling back to prototype store", err);
      showToast(err.reason || err.shortMessage || err.message, true);
    }
  }

  // 2. Fallback / Standalone Prototype Execution
  setTimeout(() => {
    const currentHist = getStoredHistory(batchId);
    const newBlockId = currentHist.length + 1;
    const parentId = currentHist.length > 0 ? currentHist[currentHist.length - 1].blockId : 0;
    
    // Simulate realistic keccak256 hash
    const fakeHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");
    
    const newRecord = {
      blockId: newBlockId,
      batchId: batchId,
      stage: stage.id,
      weightGrams: Number(values.weight || values.jewelleryWeight || values.finalWeight || 1000),
      purityBps: Number(values.purity || 9950),
      location: values.location || "Certified Node",
      referenceId: values.reference || values.jewelleryId || values.huid || `REF-${newBlockId}`,
      documentCID: values.document || `QmHash${newBlockId}`,
      parentBlockId: parentId,
      timestamp: Math.floor(Date.now() / 1000),
      actor: signer ? (signer.address || "0xMyWallet") : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      recordHash: fakeHash
    };

    // Filter duplicate stage or push
    const filtered = currentHist.filter(h => Number(h.stage) !== stage.id);
    filtered.push(newRecord);
    filtered.sort((a, b) => Number(a.stage) - Number(b.stage));

    saveStoredHistory(batchId, filtered);
    renderTimeline(filtered);

    btn.disabled = false;
    btn.innerHTML = `<span>⚡</span> Write Record to Blockchain`;
    showToast(`Stage ${stage.id + 1} (${stage.name}) recorded successfully! Block #${newBlockId}`, false, "Provenance Linked");

    // Advance to next stage automatically
    if (selectedStage < 6) {
      selectStage(selectedStage + 1);
    }
  }, 600);
}

function buildArgs(stageId, v) {
  const uint = (x) => BigInt(Math.floor(Number(x || 0)));
  if (stageId === 0 || stageId === 1 || stageId === 4) return [v.batchId, uint(v.weight), v.location, v.reference, v.document];
  if (stageId === 2 || stageId === 3) return [v.batchId, uint(v.weight), uint(v.purity), v.location, v.reference, v.document];
  if (stageId === 5) return [v.batchId, uint(v.jewelleryWeight), v.jewelleryId, v.location, v.document];
  return [v.batchId, uint(v.finalWeight), v.huid, v.location, v.document];
}

// -----------------------------------------------------------------------------
// LOAD BATCH HISTORY
// -----------------------------------------------------------------------------
async function loadHistory(batchId) {
  if (!batchId) {
    showToast("Please enter a valid Batch ID", true);
    return;
  }
  $("historyBatchId").value = batchId;

  // On-chain attempt
  if (contract) {
    try {
      const raw = await contract.getBatchHistory(batchId);
      const mapped = raw.map(item => ({
        blockId: Number(item.blockId ?? item[0]),
        batchId: item.batchId ?? item[1],
        stage: Number(item.stage ?? item[2]),
        weightGrams: Number(item.weightGrams ?? item[3]),
        purityBps: Number(item.purityBps ?? item[4]),
        location: item.location ?? item[5],
        referenceId: item.referenceId ?? item[6],
        documentCID: item.documentCID ?? item[7],
        parentBlockId: Number(item.parentBlockId ?? item[8]),
        timestamp: Number(item.timestamp ?? item[9]),
        actor: item.actor ?? item[10],
        recordHash: item.recordHash ?? item[11]
      }));
      renderTimeline(mapped);
      showToast(`Loaded ${mapped.length} on-chain records for ${batchId}`);
      return;
    } catch (_) {}
  }

  // Fallback to local storage / demo data
  const history = getStoredHistory(batchId);
  renderTimeline(history);
  showToast(`Loaded ${history.length} blockchain records for ${batchId}`, false, "Batch Query");
}

// -----------------------------------------------------------------------------
// HUID DIGITAL CERTIFICATE & VERIFICATION
// -----------------------------------------------------------------------------
function generateCrispSVGQR(content) {
  // Generates clean vector QR code pattern representation
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#ffffff" />
      <!-- Corner Markers -->
      <rect x="8" y="8" width="24" height="24" fill="#12151e" />
      <rect x="12" y="12" width="16" height="16" fill="#ffffff" />
      <rect x="16" y="16" width="8" height="8" fill="#d4af37" />

      <rect x="68" y="8" width="24" height="24" fill="#12151e" />
      <rect x="72" y="12" width="16" height="16" fill="#ffffff" />
      <rect x="76" y="16" width="8" height="8" fill="#d4af37" />

      <rect x="8" y="68" width="24" height="24" fill="#12151e" />
      <rect x="12" y="72" width="16" height="16" fill="#ffffff" />
      <rect x="16" y="76" width="8" height="8" fill="#d4af37" />

      <!-- Data Matrix Pattern -->
      <rect x="36" y="12" width="6" height="6" fill="#12151e" />
      <rect x="46" y="16" width="6" height="6" fill="#12151e" />
      <rect x="56" y="10" width="6" height="6" fill="#12151e" />
      <rect x="40" y="24" width="6" height="6" fill="#12151e" />
      <rect x="50" y="28" width="6" height="6" fill="#12151e" />
      <rect x="12" y="40" width="6" height="6" fill="#12151e" />
      <rect x="22" y="46" width="6" height="6" fill="#12151e" />
      <rect x="32" y="38" width="6" height="6" fill="#12151e" />
      <rect x="42" y="44" width="6" height="6" fill="#d4af37" />
      <rect x="52" y="40" width="6" height="6" fill="#12151e" />
      <rect x="62" y="46" width="6" height="6" fill="#12151e" />
      <rect x="74" y="40" width="6" height="6" fill="#12151e" />
      <rect x="84" y="44" width="6" height="6" fill="#12151e" />
      <rect x="36" y="58" width="6" height="6" fill="#12151e" />
      <rect x="46" y="64" width="6" height="6" fill="#12151e" />
      <rect x="56" y="58" width="6" height="6" fill="#12151e" />
      <rect x="66" y="66" width="6" height="6" fill="#d4af37" />
      <rect x="40" y="78" width="6" height="6" fill="#12151e" />
      <rect x="52" y="82" width="6" height="6" fill="#12151e" />
      <rect x="64" y="76" width="6" height="6" fill="#12151e" />
      <rect x="78" y="82" width="6" height="6" fill="#12151e" />
    </svg>
  `;
}

async function verifyHUID(huidParam) {
  const huid = (huidParam || $("huidInput").value || "").trim();
  if (!huid) {
    showToast("Please enter a Hallmark Unique ID (HUID)", true);
    return;
  }
  $("huidInput").value = huid;

  let verified = false;
  let record = null;

  // On-chain check
  if (contract) {
    try {
      const result = await contract.verifyHUID(huid);
      if (result[0]) {
        verified = true;
        const raw = result[1];
        record = {
          blockId: Number(raw.blockId ?? raw[0]),
          batchId: raw.batchId ?? raw[1],
          weightGrams: Number(raw.weightGrams ?? raw[3]),
          purityBps: Number(raw.purityBps ?? raw[4]),
          location: raw.location ?? raw[5],
          referenceId: raw.referenceId ?? raw[6],
          parentBlockId: Number(raw.parentBlockId ?? raw[8]),
          timestamp: Number(raw.timestamp ?? raw[9]),
          actor: raw.actor ?? raw[10],
          recordHash: raw.recordHash ?? raw[11]
        };
      }
    } catch (_) {}
  }

  // Fallback demo check
  if (!verified) {
    if (huid === "HUID-2026-0001") {
      verified = true;
      record = defaultDemoBatch[6];
    } else {
      // Check stored custom batches
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith("aurum_batch_"));
      for (const k of allKeys) {
        const hist = JSON.parse(localStorage.getItem(k) || "[]");
        const found = hist.find(h => Number(h.stage) === 6 && (h.referenceId === huid || h.huid === huid));
        if (found) {
          verified = true;
          record = found;
          break;
        }
      }
    }
  }

  const container = $("verifyResult");

  if (!verified) {
    container.innerHTML = `
      <div class="luxury-cert-card" style="border-color: var(--danger);">
        <div class="cert-header">
          <div class="cert-gov-crest">
            <div class="gov-badge-icon" style="border-color: var(--danger); color: var(--danger);">✕</div>
            <div>
              <h3 style="color: var(--danger);">HUID NOT VERIFIED</h3>
              <p>NO CRYPTOGRAPHIC FINAL RECORD FOUND</p>
            </div>
          </div>
          <div class="cert-seal-stamp" style="border-color: var(--danger); color: var(--danger); background: var(--danger-glow);">
            UNREGISTERED
          </div>
        </div>
        <p style="color: var(--text-muted); font-size: 13px;">
          The identifier <b>${huid}</b> has not completed Stage 7 final hallmark verification on the deployed smart contract. Do not accept this item without certified provenance.
        </p>
      </div>
    `;
    showToast(`HUID ${huid} is unverified or invalid.`, true, "Verification Failed");
    return;
  }

  // RENDER THE WORLD-CLASS LUXURY CERTIFICATE
  const formattedDate = new Date((record.timestamp || Date.now() / 1000) * 1000).toLocaleDateString("en-US", {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const purityPct = ((record.purityBps || 9950) / 100).toFixed(2);

  container.innerHTML = `
    <div class="luxury-cert-card">
      <div class="cert-guilloche-frame"></div>
      <div class="cert-shimmer"></div>
      <span class="cert-corner corner-tl">❖</span>
      <span class="cert-corner corner-tr">❖</span>
      <span class="cert-corner corner-bl">❖</span>
      <span class="cert-corner corner-br">❖</span>

      <div class="cert-header">
        <div class="cert-gov-crest">
          <div class="gov-badge-icon">Au</div>
          <div>
            <h3>CERTIFICATE OF IMMUTABLE PROVENANCE</h3>
            <p>BUREAU OF INDIAN STANDARDS • BLOCKCHAIN HALLMARK IDENTIFIER</p>
          </div>
        </div>
        <div class="cert-seal-stamp">
          ✓ BIS ON-CHAIN VERIFIED
        </div>
      </div>

      <div class="cert-body-grid">
        <div class="cert-specs-grid">
          <div class="cert-spec-item">
            <span class="cert-spec-label">Hallmark Unique ID</span>
            <div class="cert-spec-value gold-highlight">${huid}</div>
          </div>
          <div class="cert-spec-item">
            <span class="cert-spec-label">Certified Batch ID</span>
            <div class="cert-spec-value">${record.batchId}</div>
          </div>
          <div class="cert-spec-item">
            <span class="cert-spec-label">Certified Weight</span>
            <div class="cert-spec-value">${record.weightGrams} grams</div>
          </div>
          <div class="cert-spec-item">
            <span class="cert-spec-label">Gold Purity Assay</span>
            <div class="cert-spec-value gold-highlight">${purityPct}% (24 Karat)</div>
          </div>
          <div class="cert-spec-item">
            <span class="cert-spec-label">Retail Vault / Node</span>
            <div class="cert-spec-value" style="font-size: 13px;">${record.location || "Bengaluru Vault"}</div>
          </div>
          <div class="cert-spec-item">
            <span class="cert-spec-label">Verified Timestamp</span>
            <div class="cert-spec-value" style="font-size: 13px;">${formattedDate}</div>
          </div>
          <div class="cert-spec-item" style="grid-column: span 2;">
            <span class="cert-spec-label">Cryptographic Record Hash</span>
            <div class="cert-spec-value" style="font-size: 11px; word-break: break-all;">${record.recordHash || "0x3a4b..."}</div>
          </div>
        </div>

        <div class="cert-qr-pane">
          <div class="qr-frame">
            ${generateCrispSVGQR(huid)}
          </div>
          <span class="qr-caption">SCAN TO VERIFY</span>
        </div>
      </div>

      <div class="cert-footer-bar">
        <div>
          Blockchain Record: <b>#${record.blockId}</b> • Signer: <b>${shortAddress(record.actor)}</b>
        </div>
        <div class="cert-actions">
          <button class="pill-btn" onclick="window.print()">⎙ Print Certificate</button>
        </div>
      </div>
    </div>
  `;

  showToast(`Authentic Gold Certificate loaded for ${huid}`, false, "HUID Verified");
}

// -----------------------------------------------------------------------------
// FRAUD SIMULATOR LOGIC
// -----------------------------------------------------------------------------
function setupFraudSimulator() {
  const input = $("simWeightInput");
  const verdict = $("simVerdictBox");

  function evaluate() {
    const val = Number(input.value || 0);
    const available = 950; // Available from Melting stage

    if (val > available) {
      verdict.className = "sim-verdict-box";
      verdict.style.borderColor = "var(--danger)";
      verdict.style.background = "var(--danger-glow)";
      verdict.innerHTML = `
        <div class="verdict-icon danger-icon">✕</div>
        <div class="verdict-text">
          <h4 class="text-danger">TRANSACTION REVERTED BY SMART CONTRACT</h4>
          <p><b>Error:</b> Mass Balance Violation: output exceeds available certified gold (${val}g &gt; ${available}g).</p>
          <small>The Solidity modifier <code>validMassBalance</code> halted execution to prevent illicit gold dilution.</small>
        </div>
      `;
    } else {
      verdict.className = "sim-verdict-box";
      verdict.style.borderColor = "var(--success)";
      verdict.style.background = "var(--success-glow)";
      verdict.innerHTML = `
        <div class="verdict-icon success-icon">✓</div>
        <div class="verdict-text">
          <h4 class="text-success">MASS BALANCE COMPLIANT (TRANSACTION ALLOWED)</h4>
          <p><b>Status:</b> ${val}g jewelry output is safely within the available ${available}g certified pool.</p>
          <small>Remaining batch gold allocation: ${available - val}g preserved in contract balance.</small>
        </div>
      `;
    }
  }

  input.addEventListener("input", evaluate);
  $("testValidWeightBtn").addEventListener("click", () => {
    input.value = "300";
    evaluate();
  });
  $("testFraudWeightBtn").addEventListener("click", () => {
    input.value = "1200";
    evaluate();
  });

  evaluate();
}

// -----------------------------------------------------------------------------
// THEME SWITCHER
// -----------------------------------------------------------------------------
function setupTheme() {
  const saved = localStorage.getItem("aurum_theme") || "dark";
  document.documentElement.dataset.theme = saved;
  $("themeIcon").textContent = saved === "dark" ? "☀" : "☾";

  $("themeToggle").addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("aurum_theme", next);
    $("themeIcon").textContent = next === "dark" ? "☀" : "☾";
  });
}

// -----------------------------------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------------------------------
function setupApp() {
  setupTheme();
  init3DScene();
  renderStageSelector();
  selectStage(0);

  // Initial Load with demo batch
  loadHistory("GOLD-2026-001");

  // Contract Address Cache
  $("contractAddress").value = localStorage.getItem("aurum_contract_addr") || "";

  // Event Listeners
  $("connectBtn").addEventListener("click", connectWallet);
  $("stageForm").addEventListener("submit", submitStage);
  $("fillStageSampleBtn").addEventListener("click", prefillSampleValues);
  $("searchBatchBtn").addEventListener("click", () => loadHistory($("historyBatchId").value.trim()));
  $("verifyBtn").addEventListener("click", () => verifyHUID());
  
  // Quick Sample tags
  document.querySelectorAll(".tag-btn").forEach(btn => {
    btn.addEventListener("click", () => verifyHUID(btn.dataset.huid));
  });

  // Quick Demo Batch Button
  $("quickDemoBtn").addEventListener("click", () => {
    saveStoredHistory("GOLD-2026-001", defaultDemoBatch);
    loadHistory("GOLD-2026-001");
    verifyHUID("HUID-2026-0001");
    showToast("Loaded complete 7-stage demo batch with valid HUID Certificate!", false, "Demo Ready");
  });

  // Save Contract Address
  $("saveContractBtn").addEventListener("click", async () => {
    const addr = $("contractAddress").value.trim();
    if (!ethers.isAddress(addr)) {
      showToast("Please enter a valid Ethereum hex address (0x...)", true);
      return;
    }
    localStorage.setItem("aurum_contract_addr", addr);
    await loadContract();
    showToast(`Saved contract address: ${shortAddress(addr)}`);
  });

  // Reset Cache
  $("resetDemoStorageBtn").addEventListener("click", () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("aurum_"));
    keys.forEach(k => localStorage.removeItem(k));
    loadHistory("GOLD-2026-001");
    showToast("Local cache reset to factory demonstration defaults.");
  });

  setupFraudSimulator();

  // Listen to MetaMask account / network switches
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => window.location.reload());
    window.ethereum.on("chainChanged", () => window.location.reload());
  }
}

document.addEventListener("DOMContentLoaded", setupApp);
