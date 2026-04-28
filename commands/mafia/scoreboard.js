const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

// voiceChannelId => Map<userId, points>
const scoreboards = new Map();

function getScoreboard(voiceChannelId) {
  if (!scoreboards.has(voiceChannelId)) {
    scoreboards.set(voiceChannelId, new Map());
  }
  return scoreboards.get(voiceChannelId);
}

function createScoreboard(members, voiceChannel) {
  const voiceChannelId = voiceChannel.id;
  const scoreboard = getScoreboard(voiceChannelId);

  const rows = [];

  members.forEach((member) => {
    const points = scoreboard.get(member.id) || 0;

    const labelBtn = new ButtonBuilder()
      .setCustomId(`label_${member.id}`)
      .setLabel(`${member.displayName}: ${points}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);

    const plusBtn = new ButtonBuilder()
      .setCustomId(`score_add_${voiceChannelId}_${member.id}`)
      .setLabel("+1")
      .setStyle(ButtonStyle.Success);

    const minusBtn = new ButtonBuilder()
      .setCustomId(`score_sub_${voiceChannelId}_${member.id}`)
      .setLabel("-1")
      .setStyle(ButtonStyle.Danger);

    rows.push(
      new ActionRowBuilder().addComponents(labelBtn, plusBtn, minusBtn),
    );
  });

  const endBtn = new ButtonBuilder()
    .setCustomId(`score_endmatch_${voiceChannelId}`)
    .setLabel("End Match")
    .setStyle(ButtonStyle.Secondary);

  rows.push(new ActionRowBuilder().addComponents(endBtn));

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0x8b0000)
        .setTitle(`Scoreboard — ${voiceChannel.name}`)
        .setFooter({
          text: "ℹ️ Only players in this voice channel can modify scores",
        }),
    ],
    components: rows,
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
        flags: 64,
      });
    }

    const members = voiceChannel.members.filter((m) => !m.user.bot);

    if (members.size === 0) {
      return interaction.reply("No players in voice channel.");
    }

    const { embeds, components: rows } = createScoreboard(
      members,
      voiceChannel,
    );
    await interaction.reply({ embeds, components: rows });
  },

  updateScore(voiceChannelId, userId, amount) {
    const scoreboard = getScoreboard(voiceChannelId);
    const current = scoreboard.get(userId) || 0;
    scoreboard.set(userId, current + amount);
  },

  getScores(voiceChannelId) {
    return getScoreboard(voiceChannelId);
  },

  resetScores(voiceChannelId) {
    getScoreboard(voiceChannelId).clear();
  },

  createScoreboard,
};
