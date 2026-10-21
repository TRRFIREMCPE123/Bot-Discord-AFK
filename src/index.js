import "dotenv/config";
import { ChannelType, Client, Events, GatewayIntentBits } from "discord.js";
import { entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";

const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
const voiceChannelId = process.env.DISCORD_VOICE_CHANNEL_ID?.trim();

if (!botToken) {
  console.error("Missing required environment variable: DISCORD_BOT_TOKEN");
  process.exit(1);
}
if (!voiceChannelId) {
  console.error("Missing required environment variable: DISCORD_VOICE_CHANNEL_ID");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

let voiceConnection;
let reconnectTimer;
let reconnectDelayMs = 5_000;
let connecting = false;
let shuttingDown = false;

function scheduleReconnect(reason) {
  if (shuttingDown || reconnectTimer) return;

  const delay = reconnectDelayMs;
  reconnectDelayMs = Math.min(reconnectDelayMs * 2, 60_000);
  console.warn("Will retry joining the voice channel in " + Math.ceil(delay / 1_000) + "s (" + reason + ").");

  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    void connectToVoiceChannel();
  }, delay);
}

async function recoverConnection(connection) {
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
  } catch {
    if (shuttingDown || voiceConnection !== connection) return;
    console.warn("Voice connection did not recover; reconnecting.");
    connection.destroy();
    voiceConnection = undefined;
    scheduleReconnect("voice connection dropped");
  }
}

async function connectToVoiceChannel() {
  if (shuttingDown || connecting || !client.isReady()) return;
  connecting = true;

  let connection;
  try {
    const channel = await client.channels.fetch(voiceChannelId);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      throw new Error("DISCORD_VOICE_CHANNEL_ID must be a server voice-channel ID.");
    }

    const botMember = channel.guild.members.me ?? (await channel.guild.members.fetchMe());
    if (!botMember.permissionsIn(channel).has(["ViewChannel", "Connect"])) {
      throw new Error("The bot needs View Channel and Connect permissions in that channel.");
    }

    if (voiceConnection && voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
      voiceConnection.destroy();
    }

    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true,
    });
    voiceConnection = connection;

    connection.on("error", (error) => {
      console.error("Voice connection error:", error.message);
      if (shuttingDown || voiceConnection !== connection) return;
      connection.destroy();
      voiceConnection = undefined;
      scheduleReconnect("voice connection error");
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      if (voiceConnection === connection) void recoverConnection(connection);
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    reconnectDelayMs = 5_000;
    console.log("Connected to voice channel " + channel.id + " and staying muted/deafened.");
  } catch (error) {
    console.error("Could not connect to the configured voice channel:", error.message);
    if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
      connection.destroy();
    }
    if (voiceConnection === connection) voiceConnection = undefined;
    scheduleReconnect("connection attempt failed");
  } finally {
    connecting = false;
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log("Logged in as " + readyClient.user.tag + ".");
  void connectToVoiceChannel();
});

client.on(Events.Error, (error) => {
  console.error("Discord client error:", error.message);
});

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("Received " + signal + "; shutting down cleanly.");
  if (reconnectTimer) clearTimeout(reconnectTimer);
  voiceConnection?.destroy();
  client.destroy();
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

client.login(botToken).catch((error) => {
  console.error("Discord login failed:", error.message);
  process.exitCode = 1;
});
