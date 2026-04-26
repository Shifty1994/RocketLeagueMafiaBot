const Discord = require("discord.js");
require("dotenv").config();

if (!process.env.TOKEN) {
  console.error("ERROR: No TOKEN found in .env");
  process.exit(1);
}

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildVoiceStates,
  ],
});

let bot = {
  client,
};

client.commands = new Discord.Collection();
client.events = new Discord.Collection();

client.loadEvents = (bot, reload) => require("./handlers/events")(bot, reload);
client.loadCommands = (bot, reload) =>
  require("./handlers/commands")(bot, reload);

client.loadEvents(bot, false);
client.loadCommands(bot, false);

client.login(process.env.TOKEN);

// Silent keep-alive heartbeat (prevents Railway from killing the bot)
setInterval(() => {
  // Do nothing visible - just stay alive
}, 5 * 60 * 1000);   // Every 5 minutes