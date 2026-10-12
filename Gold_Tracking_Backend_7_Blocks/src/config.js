require("dotenv").config();
const fs = require("fs");
const path = require("path");

function loadDeployment() {
  const file = path.join(__dirname, "..", "deployments", "localhost.json");
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  privateKey: process.env.PRIVATE_KEY || "",
  loadDeployment
};
