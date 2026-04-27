const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const scoreboardManager = require("./scoreboard.js");

module.exports = {
  name: "showscores",
  category: "mafia",

  data: new SlashCommandBuilder()
    .setName("showscores")
    .setDescription("Show total scoreboard"),

  async execute(interaction) {
    const scores = scoreboardManager.getScores(interaction.guild.id);

    if (scores.size === 0) {
      return interaction.reply("No points recorded yet.");
    }

    let description = "";

    for (const [userId, points] of scores) {
      const member = interaction.guild.members.cache.get(userId);
      const name = member ? member.displayName : "Unknown";

      description += `• **${name}** — ${points} pts\n`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle("📊 Total Scoreboard")
      .setDescription(description);

    await interaction.reply({ embeds: [embed] });
  },
};
