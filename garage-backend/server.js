import "./config/env.js"; 
import app from "./app.js";
import { ensureAccountantsTableExists } from "./config/bootstrapAccountantsTable.js";
import { initSocketServer } from "./sockets/trackingSocket.js";
import http from "http";
import cron from "node-cron";
import { runFullBackup } from "./services/backupService.js";

const PORT = process.env.PORT || 5000;


cron.schedule("0 0 * * *", () => {
  runFullBackup();
});



process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION (non-fatal):");
  console.error(err?.name, err?.message, err?.stack);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION (non-fatal):");
  console.error(err?.name, err?.message, err?.stack);
});

const httpServer = http.createServer(app);
const io = initSocketServer(httpServer);

const server = httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  ensureAccountantsTableExists().catch(err => {
    console.error("Delayed Bootstrap Error:", err.message);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server gracefully.");
  server.close(() => {
    console.log("Process terminated!");
  });
});