const Discord = require("discord.js");

require("dotenv").config();

const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);

client.on("messageCreate", (msg) => {
  if (msg.content === "Hello") {
    msg.reply("World");
  }
});
