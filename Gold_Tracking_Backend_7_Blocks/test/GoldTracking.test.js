const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GoldTracking - 7 Stage Backend", function () {
  async function deploy() {
    const GoldTracking = await ethers.getContractFactory("GoldTracking");
    const contract = await GoldTracking.deploy();
    await contract.waitForDeployment();
    return contract;
  }

  async function createSevenStages(contract) {
    await contract.createMiningBlock(
      "GOLD001",
      1000,
      "Mine-A",
      "MINE-001",
      "CID-MINE"
    );

    await contract.createTransportBlock(
      "GOLD001",
      1000,
      "Route-A",
      "TRANS-001",
      "CID-TRANS"
    );

    await contract.createRefiningBlock(
      "GOLD001",
      995,
      9990,
      "Refinery-A",
      "REF-001",
      "CID-REF"
    );

    await contract.createHallmarkingBlock(
      "GOLD001",
      995,
      9990,
      "Hallmark-A",
      "HALL-001",
      "CID-HALL"
    );

    await contract.createAgencyMeltingBlock(
      "GOLD001",
      990,
      "Agency-A",
      "MELT-001",
      "CID-MELT"
    );

    await contract.createManufacturingBlock(
      "GOLD001",
      20,
      "JEW-001",
      "Manufacturer-A",
      "CID-JEW"
    );

    await contract.createFinalVerificationBlock(
      "GOLD001",
      20,
      "HUID001",
      "Retail-A",
      "CID-FINAL"
    );
  }

  it("should create all 7 lifecycle records in order", async function () {
    const contract = await deploy();
    await createSevenStages(contract);

    const history = await contract.getBatchHistory("GOLD001");

    expect(history.length).to.equal(7);
    expect(Number(history[0].stage)).to.equal(0);
    expect(Number(history[6].stage)).to.equal(6);
    expect(history[6].referenceId).to.equal("HUID001");
  });

  it("should reject manufacturing weight above available certified gold", async function () {
    const contract = await deploy();

    await contract.createMiningBlock(
      "GOLD002",
      100,
      "Mine-B",
      "MINE-002",
      ""
    );

    await contract.createTransportBlock(
      "GOLD002",
      100,
      "Route-B",
      "TRANS-002",
      ""
    );

    await contract.createRefiningBlock(
      "GOLD002",
      99,
      9990,
      "Refinery-B",
      "REF-002",
      ""
    );

    await contract.createHallmarkingBlock(
      "GOLD002",
      99,
      9990,
      "Hallmark-B",
      "HALL-002",
      ""
    );

    await contract.createAgencyMeltingBlock(
      "GOLD002",
      98,
      "Agency-B",
      "MELT-002",
      ""
    );

    await expect(
      contract.createManufacturingBlock(
        "GOLD002",
        120,
        "JEW-002",
        "Manufacturer-B",
        ""
      )
    ).to.be.revertedWith(
      "Mass Balance Violation: output exceeds available certified gold"
    );
  });

  it("should verify a final HUID", async function () {
    const contract = await deploy();
    await createSevenStages(contract);

    const result = await contract.verifyHUID("HUID001");

    expect(result[0]).to.equal(true);
    expect(result[1].referenceId).to.equal("HUID001");
    expect(result[1].batchId).to.equal("GOLD001");
  });
});
