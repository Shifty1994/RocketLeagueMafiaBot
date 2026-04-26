const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

let scoreboard = new Map(); // userId => points

module.exports = {
  name: "roundend",
  category: "mafia",

  data: new SlashCommandBuilder()
    .setName("roundend")
    .setDescription("Show live scoreboard with +1 / -1 buttons per player"),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You must be in a voice channel.",
        flags: 64,
      });
    }

    const members = voiceChannel.members.filter((m) => !m.user.bot);

    if (members.size === 0) {
      return interaction.reply("No players in voice channel.");
    }

    const { embed, rows } = createScoreboardEmbed(members);

    await interaction.reply({ embeds: [embed], components: rows });
  },

  updateScoreboard(userId, amount) {
    const current = scoreboard.get(userId) || 0;
    scoreboard.set(userId, current + amount);
  },

  getScoreboard() {
    return scoreboard;
  },

  resetScoreboard() {
    scoreboard.clear();
  },
};

// Helper function
function createScoreboardEmbed(members) {
  let description = "";
  const rows = [];

  members.forEach((member) => {
    const points = scoreboard.get(member.id) || 0;
    description += `**${member.user.username}**: ${points}\n`;

    const plusBtn = new ButtonBuilder()
      .setCustomId(`score_add_${member.id}`)
      .setLabel("+1")
      .setStyle(ButtonStyle.Success);

    const minusBtn = new ButtonBuilder()
      .setCustomId(`score_sub_${member.id}`)
      .setLabel("-1")
      .setStyle(ButtonStyle.Danger);

    rows.push(new ActionRowBuilder().addComponents(plusBtn, minusBtn));
  });

  // Add "End Match & Reset" button at the bottom
  const resetBtn = new ButtonBuilder()
    .setCustomId("score_reset")
    .setLabel("End Match & Reset Scores")
    .setStyle(ButtonStyle.Danger);

  const resetRow = new ActionRowBuilder().addComponents(resetBtn);

  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle("🏆 Scoreboard")
    .setDescription(description || "No players")
    .setFooter({
      text: "Click +1 or -1 on players • End Match to reset all scores",
    })
    .setTimestamp();

  return { embed, rows: [...rows, resetRow] };
}

// Export helper for interactionCreate
module.exports.createScoreboardEmbed = createScoreboardEmbed;
