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

    const { content, rows } = createScoreboard(members);

    await interaction.reply({ content, components: rows });
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

function createScoreboard(members) {
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

    // One row per player: name/score above, buttons below (best compromise)
    rows.push(new ActionRowBuilder().addComponents(plusBtn, minusBtn));
  });

  const endBtn = new ButtonBuilder()
    .setCustomId("score_endmatch")
    .setLabel("End Match")
    .setStyle(ButtonStyle.Secondary);

  rows.push(new ActionRowBuilder().addComponents(endBtn));

  return { content: text, rows };
}

module.exports.createScoreboard = createScoreboard;
