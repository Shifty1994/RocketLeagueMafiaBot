const Discord = require("discord.js");

require("dotenv").config();

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.MessageContent, // needed for prefix still
  ],
  partials: [Discord.Partials.Message, Discord.Partials.Channel],
});

let bot = {
  client,
  prefix: "n.",
  owners: ["163409757883858945"],
};

client.commands = new Discord.Collection();
client.events = new Discord.Collection();

client.loadEvents = (bot, reload) => require("./handlers/events")(bot, reload);
client.loadCommands = (bot, reload) =>
  require("./handlers/commands")(bot, reload);

client.loadEvents(bot, false);
client.loadCommands(bot, false);

console.log("Registered slash-capable commands:");
client.commands.forEach((cmd) => {
  if (cmd.data) console.log(` - /${cmd.name}`);
});

module.exports = bot;

client.login(process.env.TOKEN);
