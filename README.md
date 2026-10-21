# Discord AFK Voice Bot

A Discord bot-account process that joins one configured server voice channel, stays self-muted and self-deafened, and retries after a dropped voice connection. It does not play audio, listen to members, or use a user-account token/self-bot.

## Requirements

- Node.js 20 or newer
- A Discord application with a bot user, added to the target server
- View Channel and Connect permissions for the bot in the target voice channel

## Configure

1. Copy .env.example to .env for local development.
2. Set DISCORD_BOT_TOKEN to the bot token from the Discord Developer Portal.
3. Set DISCORD_VOICE_CHANNEL_ID to the target server voice-channel ID. Enable Developer Mode in Discord, then choose Copy Channel ID. The channel ID is an identifier, not a secret.
4. Never commit .env or share the bot token. The .env file is ignored by Git.

## Run

    npm install
    npm start

The bot connects after login. If Discord drops the voice connection, it retries with a backoff of up to 60 seconds.

## Keep it online

GitHub stores the source code; it does not run the bot. To keep the bot online 24/7, deploy it as a long-running worker on a host that does not sleep. Configure DISCORD_BOT_TOKEN as that host's secret/environment variable and DISCORD_VOICE_CHANNEL_ID as an environment variable, then use npm start as the start command. Do not put the token in GitHub Actions, source files, or this repository.

If the bot token was ever committed publicly, reset it in the Discord Developer Portal before running the bot.

## Optional official desktop RPC

RPC DISCORD.js sets a custom Playing activity through Discord's local IPC. It uses your Discord application's Client ID, not a personal-account token. It does not set or imitate Spotify's real Listening status; for that, use Discord's Spotify connection.

1. Create or select an application in the Discord Developer Portal and copy its Application ID.
2. Set DISCORD_CLIENT_ID, RPC_DETAILS, and RPC_STATE in your local .env file.
3. Open and sign in to the Discord desktop app on the same computer, and enable activity sharing in Discord settings.
4. From this repository, run:

    npm install
    npm run rpc

This script must run on the same computer as Discord Desktop because it connects over local IPC. It will keep retrying if Discord is closed, and clears the activity when stopped with Ctrl+C. Do not deploy this local RPC script to GitHub Actions or a remote Replit server.
