const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const GoldTracking = await hre.ethers.getContractFactory("GoldTracking");
  const contract = await GoldTracking.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`GoldTracking deployed to: ${address}`);

  const artifact = await hre.artifacts.readArtifact("GoldTracking");

  const deployment = {
    address,
    abi: artifact.abi,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "localhost.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("Deployment file created: deployments/localhost.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
