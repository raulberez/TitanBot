require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Initialize the Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
  ],
});

// Collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

/**
 * Dynamically load all command files from the commands directory
 */
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(
          `[WARN] Command at ${filePath} is missing "data" or "execute" property.`
        );
      }
    }
  }
}

/**
 * Dynamically load all event files from the events directory
 */
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (error) => {
  console.error('[ERROR] Unhandled promise rejection:', error);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('[ERROR] DISCORD_TOKEN is not set in environment variables.');
  process.exit(1);
}

client.login(token).catch((err) => {
  console.error('[ERROR] Failed to login to Discord:', err.message);
  process.exit(1);
});
