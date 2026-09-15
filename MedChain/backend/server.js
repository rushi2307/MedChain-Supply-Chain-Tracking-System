require("dotenv").config();

const express = require("express");
const cors = require("cors");
const medicineRoutes = require("./routes/medicine");
const { connectDB } = require("./config/db");
const requestLogger = require("./middleware/requestLogger");
const logger = require("./utils/logger");

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use("/api/medicines", medicineRoutes);

// Test API
app.get("/", (req, res) => {
  res.send("MedChain Backend is Running!");
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    logger.info("database.connected", { database: process.env.MONGODB_URI?.replace(/\/\/.*@/, "//***@") });
    app.listen(PORT, () => {
      logger.info("server.started", { port: PORT, network: process.env.NETWORK || "localhost" });
    });
  } catch (error) {
    logger.error("server.start_failed", { error: error.message });
    process.exitCode = 1;
  }
}

startServer();
