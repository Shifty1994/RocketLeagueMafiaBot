const Discord = require("discord.js");

require("dotenv").config();

const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_VOICE_STATES"],
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

module.exports = bot;

const generalId = "746048121125076996";

client.on("guildMemberAdd", (member) => {
  member.guild.channels.cache
    .get(rocketLeagueMafiaId)
    .send(`<@${member.id} Welcome to the server`);
});

client.login(process.env.TOKEN);
