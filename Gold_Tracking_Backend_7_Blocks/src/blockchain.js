const { ethers } = require("ethers");
const { rpcUrl, privateKey, loadDeployment } = require("./config");

let contractInstance = null;

async function getContract() {
  if (contractInstance) return contractInstance;
  const deployment = loadDeployment();
  if (!deployment || !deployment.address) {
    throw new Error(
      "Contract deployment not found. Deploy GoldTracking.sol to your network, or use MetaMask in the frontend."
    );
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  let signer;
  if (privateKey) {
    signer = new ethers.Wallet(privateKey, provider);
  } else {
    signer = await provider.getSigner(0);
  }
  contractInstance = new ethers.Contract(
    deployment.address,
    deployment.abi,
    signer
  );
  return contractInstance;
}

const stageNames = [
  "Mining",
  "Transport",
  "Refining",
  "Hallmarking",
  "AgencyMelting",
  "Manufacturing",
  "FinalVerification"
];

function formatRecord(record) {
  return {
    blockId: Number(record.blockId),
    batchId: record.batchId,
    stage: stageNames[Number(record.stage)],
    weightGrams: Number(record.weightGrams),
    purityPercent:
      Number(record.purityBps) === 0
        ? null
        : Number(record.purityBps) / 100,
    location: record.location,
    referenceId: record.referenceId,
    documentCID: record.documentCID,
    parentBlockId: record.parentBlockId,
    timestamp: new Date(Number(record.timestamp) * 1000).toISOString(),
    actor: record.actor,
    recordHash: record.recordHash
  };
}

async function createMining(data) {
  const contract = await getContract();
  const tx = await contract.createMiningBlock(
    data.batchId,
    data.weightGrams,
    data.location || "",
    data.referenceId || "",
    data.documentCID || ""
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function createTransport(data) {
  const contract = await getContract();
  const tx = await contract.createTransportBlock(
    data.batchId,
    data.weightGrams,
    data.location || "",
    data.referenceId || "",
    data.documentCID || ""
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function createRefining(data) {
  const contract = await getContract();
  const tx = await contract.createRefiningBlock(
    data.batchId,
    data.weightGrams,
    data.purityBps,
    data.location || "",
    data.referenceId || "",
    data.documentCID || ""
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function createHallmarking(data) {
  const contract = await getContract();
  const tx = await contract.createHallmarkingBlock(
    data.batchId,
    data.weightGrams,
    data.purityBps,
    data.location || "",
    data.referenceId || "",
    data.documentCID || ""
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function createAgencyMelting(data) {
  const contract = await getContract();
  const tx = await contract.createAgencyMeltingBlock(
    data.batchId,
    data.weightGrams,
    data.location || "",
    data.referenceId || "",
    data.documentCID || ""
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function createManufacturing(data) {
  const contract = await getContract();
  const tx = await contract.createManufacturingBlock(
    data.batchId,
    data.jewelleryWeightGrams,
    data.jewelleryId,
    data.location || "",
    data.documentCID || ""
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function createFinalVerification(data) {
  const contract = await getContract();
  const tx = await contract.createFinalVerificationBlock(
    data.batchId,
    data.jewelleryWeightGrams,
    data.huid,
    data.location || "",
    data.documentCID || ""
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function getHistory(batchId) {
  const contract = await getContract();
  const records = await contract.getBatchHistory(batchId);
  return records.map(formatRecord);
}

async function getLatest(batchId) {
  const contract = await getContract();
  return formatRecord(await contract.getLatestBlock(batchId));
}

async function verifyHUID(huid) {
  const contract = await getContract();
  const result = await contract.verifyHUID(huid);
  return {
    verified: result[0],
    record: result[0] ? formatRecord(result[1]) : null
  };
}

module.exports = {
  createMining,
  createTransport,
  createRefining,
  createHallmarking,
  createAgencyMelting,
  createManufacturing,
  createFinalVerification,
  getHistory,
  getLatest,
  verifyHUID,
  formatRecord
};
