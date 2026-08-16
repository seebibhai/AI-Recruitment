import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`[server] AI Recruitment Platform API running on port ${env.port} (${env.nodeEnv})`);
  });
};

start();

process.on("unhandledRejection", (err) => {
  console.error("[server] Unhandled promise rejection:", err);
});
