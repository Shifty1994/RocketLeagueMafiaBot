const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

// voiceChannelId => Map<userId, points>
const scoreboards = new Map();

// voiceChannelId => "add" | "sub"
const scoreModes = new Map();

function getScoreboard(voiceChannelId) {
  if (!scoreboards.has(voiceChannelId)) {
    scoreboards.set(voiceChannelId, new Map());
  }
  return scoreboards.get(voiceChannelId);
}

function createScoreboard(members, voiceChannel) {
  const voiceChannelId = voiceChannel.id;
  const scoreboard = getScoreboard(voiceChannelId);

  const mode = scoreModes.get(voiceChannelId) || "add";

  const rows = [];
  let currentRow = new ActionRowBuilder();

  let count = 0;

  members.forEach((member) => {
    const points = scoreboard.get(member.id) || 0;

    const btn = new ButtonBuilder()
      .setCustomId(`score_player_${voiceChannelId}_${member.id}`)
      .setLabel(`${member.displayName}: ${points}`)
      .setStyle(ButtonStyle.Secondary);

    currentRow.addComponents(btn);
    count++;

    if (count % 5 === 0) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
  });

  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }

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
          text: "Click a player to modify score • Toggle mode for + / -",
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
    .setDescription("Live scoreboard with buttons"),

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

  resetScores(voiceChannelId) {
    getScoreboard(voiceChannelId).clear();
    scoreModes.delete(voiceChannelId);
  },

  toggleMode(voiceChannelId) {
    const current = scoreModes.get(voiceChannelId) || "add";
    const next = current === "add" ? "sub" : "add";
    scoreModes.set(voiceChannelId, next);
  },

  getMode(voiceChannelId) {
    return scoreModes.get(voiceChannelId) || "add";
  },

  createScoreboard,
};
