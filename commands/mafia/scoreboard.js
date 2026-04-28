const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

// voiceChannelId => Map<userId, points>
const scoreboards = new Map();

// voiceChannelId => page number
const scorePages = new Map();

// voiceChannelId => "add" | "sub"
const scoreModes = new Map();

function getScoreboard(voiceChannelId) {
  if (!scoreboards.has(voiceChannelId)) {
    scoreboards.set(voiceChannelId, new Map());
  }
  return scoreboards.get(voiceChannelId);
}

function getPage(voiceChannelId) {
  return scorePages.get(voiceChannelId) || 0;
}

function setPage(voiceChannelId, page) {
  scorePages.set(voiceChannelId, page);
}

function getMode(voiceChannelId) {
  return scoreModes.get(voiceChannelId) || "add";
}

function toggleMode(voiceChannelId) {
  const current = getMode(voiceChannelId);
  scoreModes.set(voiceChannelId, current === "add" ? "sub" : "add");
}

function resetState(voiceChannelId) {
  scoreboards.delete(voiceChannelId);
  scorePages.delete(voiceChannelId);
  scoreModes.delete(voiceChannelId);
}

function createScoreboard(members, voiceChannel) {
  const voiceChannelId = voiceChannel.id;
  const scoreboard = getScoreboard(voiceChannelId);

  const allMembers = Array.from(members.values());

  const perPage = 5;
  const page = getPage(voiceChannelId);
  const totalPages = Math.max(1, Math.ceil(allMembers.length / perPage));

  const safePage = Math.min(page, totalPages - 1);
  setPage(voiceChannelId, safePage);

  const start = safePage * perPage;
  const pagedMembers = allMembers.slice(start, start + perPage);

  const rows = [];
  let row = new ActionRowBuilder();

  pagedMembers.forEach((member) => {
    const points = scoreboard.get(member.id) || 0;

    const btn = new ButtonBuilder()
      .setCustomId(`score_player_${voiceChannelId}_${member.id}`)
      .setLabel(`${member.displayName}: ${points}`)
      .setStyle(ButtonStyle.Secondary);

    row.addComponents(btn);
  });

  if (row.components.length > 0) {
    rows.push(row);
  }

  // NAVIGATION ROW
  const prevBtn = new ButtonBuilder()
    .setCustomId(`score_prev_${voiceChannelId}`)
    .setLabel("⬅ Prev")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(safePage === 0);

  const pageBtn = new ButtonBuilder()
    .setCustomId(`score_page_${voiceChannelId}`)
    .setLabel(`Page ${safePage + 1}/${totalPages}`)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

  const nextBtn = new ButtonBuilder()
    .setCustomId(`score_next_${voiceChannelId}`)
    .setLabel("Next ➡")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(safePage >= totalPages - 1);

  rows.push(new ActionRowBuilder().addComponents(prevBtn, pageBtn, nextBtn));

  // CONTROL ROW
  const mode = getMode(voiceChannelId);

  const modeBtn = new ButtonBuilder()
    .setCustomId(`score_toggle_${voiceChannelId}`)
    .setLabel(mode === "add" ? "Mode: +1" : "Mode: -1")
    .setStyle(mode === "add" ? ButtonStyle.Success : ButtonStyle.Danger);

  const endBtn = new ButtonBuilder()
    .setCustomId(`score_endmatch_${voiceChannelId}`)
    .setLabel("End Match")
    .setStyle(ButtonStyle.Secondary);

  rows.push(new ActionRowBuilder().addComponents(modeBtn, endBtn));

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0x8b0000)
        .setTitle(`Scoreboard — ${voiceChannel.name}`)
        .setFooter({
          text: "Click player to modify score • Use arrows to change page",
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
    .setDescription("Live scoreboard with pagination"),

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

    const { embeds, components } = createScoreboard(members, voiceChannel);

    await interaction.reply({ embeds, components });
  },

  updateScore(voiceChannelId, userId, amount) {
    const scoreboard = getScoreboard(voiceChannelId);
    const current = scoreboard.get(userId) || 0;
    scoreboard.set(userId, current + amount);
  },

  getScores(voiceChannelId) {
    return getScoreboard(voiceChannelId);
  },

  resetScores: resetState,

  createScoreboard,
  getMode,
  toggleMode,
  getPage,
  setPage,
};
