const express = require("express");
const cors = require("cors");
const {
  createMining,
  createTransport,
  createRefining,
  createHallmarking,
  createAgencyMelting,
  createManufacturing,
  createFinalVerification,
  getHistory,
  getLatest,
  verifyHUID
} = require("./blockchain");
const path = require("path");
const { port, loadDeployment } = require("./config");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

function asyncRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      const message =
        error.shortMessage ||
        error.reason ||
        error.info?.error?.message ||
        error.message ||
        "Blockchain transaction failed";

      res.status(400).json({
        success: false,
        error: message
      });
    }
  };
}

function requireFields(body, fields) {
  const missing = fields.filter(
    (field) =>
      body[field] === undefined ||
      body[field] === null ||
      body[field] === ""
  );

  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
}

app.get("/api/health", (req, res) => {
  const deployment = loadDeployment();

  res.json({
    success: true,
    service: "Gold Tracking Backend",
    deployed: Boolean(deployment && deployment.address),
    contractAddress: deployment ? deployment.address : null,
    stages: [
      "Mining",
      "Transport",
      "Refining",
      "Hallmarking",
      "AgencyMelting",
      "Manufacturing",
      "FinalVerification"
    ]
  });
});

app.post(
  "/api/blocks/1-mining",
  asyncRoute(async (req, res) => {
    requireFields(req.body, ["batchId", "weightGrams", "location"]);

    const result = await createMining({
      ...req.body,
      weightGrams: Number(req.body.weightGrams)
    });

    res.json({ success: true, stage: "Mining", ...result });
  })
);

app.post(
  "/api/blocks/2-transport",
  asyncRoute(async (req, res) => {
    requireFields(req.body, ["batchId", "weightGrams", "location"]);

    const result = await createTransport({
      ...req.body,
      weightGrams: Number(req.body.weightGrams)
    });

    res.json({ success: true, stage: "Transport", ...result });
  })
);

app.post(
  "/api/blocks/3-refining",
  asyncRoute(async (req, res) => {
    requireFields(req.body, [
      "batchId",
      "weightGrams",
      "purityBps",
      "location"
    ]);

    const result = await createRefining({
      ...req.body,
      weightGrams: Number(req.body.weightGrams),
      purityBps: Number(req.body.purityBps)
    });

    res.json({ success: true, stage: "Refining", ...result });
  })
);

app.post(
  "/api/blocks/4-hallmarking",
  asyncRoute(async (req, res) => {
    requireFields(req.body, [
      "batchId",
      "weightGrams",
      "purityBps",
      "location"
    ]);

    const result = await createHallmarking({
      ...req.body,
      weightGrams: Number(req.body.weightGrams),
      purityBps: Number(req.body.purityBps)
    });

    res.json({ success: true, stage: "Hallmarking", ...result });
  })
);

app.post(
  "/api/blocks/5-agency-melting",
  asyncRoute(async (req, res) => {
    requireFields(req.body, ["batchId", "weightGrams", "location"]);

    const result = await createAgencyMelting({
      ...req.body,
      weightGrams: Number(req.body.weightGrams)
    });

    res.json({ success: true, stage: "AgencyMelting", ...result });
  })
);

app.post(
  "/api/blocks/6-manufacturing",
  asyncRoute(async (req, res) => {
    requireFields(req.body, [
      "batchId",
      "jewelleryWeightGrams",
      "jewelleryId",
      "location"
    ]);

    const result = await createManufacturing({
      ...req.body,
      jewelleryWeightGrams: Number(req.body.jewelleryWeightGrams)
    });

    res.json({
      success: true,
      stage: "Manufacturing",
      massBalance: "PASSED",
      ...result
    });
  })
);

app.post(
  "/api/blocks/7-final-verification",
  asyncRoute(async (req, res) => {
    requireFields(req.body, [
      "batchId",
      "jewelleryWeightGrams",
      "huid",
      "location"
    ]);

    const result = await createFinalVerification({
      ...req.body,
      jewelleryWeightGrams: Number(req.body.jewelleryWeightGrams)
    });

    res.json({
      success: true,
      stage: "FinalVerification",
      ...result
    });
  })
);

app.get(
  "/api/gold/:batchId/history",
  asyncRoute(async (req, res) => {
    const history = await getHistory(req.params.batchId);

    res.json({
      success: true,
      batchId: req.params.batchId,
      totalBlocks: history.length,
      history
    });
  })
);

app.get(
  "/api/gold/:batchId/latest",
  asyncRoute(async (req, res) => {
    const latest = await getLatest(req.params.batchId);

    res.json({
      success: true,
      latest
    });
  })
);

app.get(
  "/api/verify/:huid",
  asyncRoute(async (req, res) => {
    const result = await verifyHUID(req.params.huid);

    res.json({
      success: true,
      ...result
    });
  })
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found"
  });
});

app.listen(port, () => {
  console.log(`Gold Tracking Backend running on http://localhost:${port}`);
});
