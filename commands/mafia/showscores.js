const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const roundend = require("./roundend");

module.exports = {
  name: "showscores",
  category: "mafia",

  data: new SlashCommandBuilder()
    .setName("showscores")
    .setDescription("Show total scoreboard"),

  async execute(interaction) {
    const scoreboard = roundend.getScoreboard();
    if (scoreboard.size === 0) {
      return interaction.reply("No points recorded yet.");
    }

    let description = "";
    for (const [userId, points] of scoreboard) {
      const member = interaction.guild.members.cache.get(userId);
      const name = member ? member.user.username : "Unknown User";
      description += `**${name}**: ${points}\n`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle("📊 Total Scoreboard")
      .setDescription(description)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
