const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

// Per-server scoreboards
const scoreboards = new Map(); // guildId => Map<userId, points>

function getScoreboard(guildId) {
  if (!scoreboards.has(guildId)) {
    scoreboards.set(guildId, new Map());
  }
  return scoreboards.get(guildId);
}

function createScoreboard(members, guildId) {
  const scoreboard = getScoreboard(guildId);
  let text = "**Scoreboard**\n\n";
  const rows = [];

  members.forEach((member) => {
    const points = scoreboard.get(member.id) || 0;
    text += `**${member.user.username}**: ${points}\n`;

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

  const endBtn = new ButtonBuilder()
    .setCustomId("score_endmatch")
    .setLabel("End Match")
    .setStyle(ButtonStyle.Secondary);

  rows.push(new ActionRowBuilder().addComponents(endBtn));

  return { content: text, rows };
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
        flags: 64,
      });
    }

    const members = voiceChannel.members.filter((m) => !m.user.bot);
    if (members.size === 0) {
      return interaction.reply("No players in voice channel.");
    }

    const { content, rows } = createScoreboard(members, interaction.guild.id);
    await interaction.reply({ content, components: rows });
  },

  updateScore(guildId, userId, amount) {
    const scoreboard = getScoreboard(guildId);
    const current = scoreboard.get(userId) || 0;
    scoreboard.set(userId, current + amount);
  },

  getScores(guildId) {
    return getScoreboard(guildId);
  },

  resetScores(guildId) {
    const scoreboard = getScoreboard(guildId);
    scoreboard.clear();
  },

  createScoreboard,
};
