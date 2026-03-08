const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  run: async (bot) => {
    console.log("Logged in as " + bot.client.user.tag);
  },
};
