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
