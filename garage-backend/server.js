import "./config/env.js"; // 1. Load env first
import app from "./app.js";

const PORT = process.env.PORT || 5000;

// 2. Add handlers for unhandled errors
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 3. Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server gracefully.");
  server.close(() => {
    console.log("Process terminated!");
  });
});