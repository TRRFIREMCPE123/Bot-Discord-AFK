import "dotenv/config";
import DiscordRPC from "discord-rpc";

const clientId = process.env.DISCORD_CLIENT_ID?.trim();
if (!clientId || !/^\d{17,20}$/.test(clientId)) {
  console.error("Set DISCORD_CLIENT_ID to your Discord application's numeric Client ID in .env.");
  process.exit(1);
}

const details = (process.env.RPC_DETAILS?.trim() || "Custom Discord activity").slice(0, 128);
const state = (process.env.RPC_STATE?.trim() || "Connected through official desktop RPC").slice(0, 128);
const rpc = new DiscordRPC.Client({ transport: "ipc" });
let shuttingDown = false;

rpc.on("ready", () => {
  rpc.setActivity({
    details,
    state,
    startTimestamp: new Date(),
    instance: false,
  }).then(() => {
    console.log("Custom Playing activity is active in Discord Desktop.");
  }).catch((error) => {
    console.error("Could not set Rich Presence:", error.message);
  });
});

rpc.on("disconnected", () => {
  if (!shuttingDown) {
    console.error("Discord Desktop RPC disconnected. Reopen Discord and restart this script.");
  }
});

rpc.login({ clientId }).catch((error) => {
  console.error("Could not connect to Discord Desktop RPC:", error.message);
  console.error("Make sure Discord Desktop is open and DISCORD_CLIENT_ID is correct.");
  process.exitCode = 1;
});

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("Received " + signal + "; clearing activity.");
  try {
    await rpc.clearActivity();
  } catch {}
  try {
    await rpc.destroy();
  } catch {}
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
