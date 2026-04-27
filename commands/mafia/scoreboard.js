const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

// Shared scoreboard state
const scoreboard = new Map();

function createScoreboard(members) {
  const rows = [];

  members.forEach((member) => {
    const points = scoreboard.get(member.id) || 0;
    const username = member.displayName;

    // 👇 fake "label" using a disabled button
    const label = new ButtonBuilder()
      .setCustomId(`label_${member.id}`)
      .setLabel(`${username} — ${points} pts`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);

    const plusBtn = new ButtonBuilder()
      .setCustomId(`score_add_${member.id}`)
      .setLabel("+1")
      .setStyle(ButtonStyle.Success);

    const minusBtn = new ButtonBuilder()
      .setCustomId(`score_sub_${member.id}`)
      .setLabel("-1")
      .setStyle(ButtonStyle.Danger);

    rows.push(new ActionRowBuilder().addComponents(label, plusBtn, minusBtn));
  });

  const endBtn = new ButtonBuilder()
    .setCustomId("score_endmatch")
    .setLabel("End Match")
    .setStyle(ButtonStyle.Secondary);

  rows.push(new ActionRowBuilder().addComponents(endBtn));

  return {
    content: "**Scoreboard**",
    rows,
  };
}

module.exports = {
  name: "scoreboard",
  category: "mafia",

  data: new SlashCommandBuilder()
    .setName("scoreboard")
    .setDescription("Live scoreboard with +1 / -1 buttons"),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You must be in a voice channel.",
        ephemeral: true,
      });
    }

    const members = voiceChannel.members.filter((m) => !m.user.bot);

    if (members.size === 0) {
      return interaction.reply("No players in voice channel.");
    }

    const { content, rows } = createScoreboard(members);

    await interaction.reply({ content, components: rows });
  },

  updateScore(userId, amount) {
    const current = scoreboard.get(userId) || 0;
    scoreboard.set(userId, current + amount);
  },

  getScores() {
    return scoreboard;
  },

  resetScores() {
    scoreboard.clear();
  },

  createScoreboard,
};
