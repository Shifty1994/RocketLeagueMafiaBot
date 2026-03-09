const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  name: "playmafia",
  category: "mafia",
  description: "Assigns mafia roles in the current voice channel",

  data: new SlashCommandBuilder()
    .setName("playmafia")
    .setDescription("Start a Mafia game in your current voice channel")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription(
          "Game mode: rl (Rocket League), kara (Karazhan/raid), default = kara",
        )
        .setRequired(false)
        .addChoices(
          { name: "Rocket League", value: "rl" },
          { name: "Karazhan/Raid", value: "kara" },
        ),
    )
    .addBooleanOption((option) =>
      option
        .setName("force")
        .setDescription("Force start even with fewer than 2 players")
        .setRequired(false),
    ),

  async execute(interaction) {
    // Defer immediately (no ephemeral option needed - defaults to visible)
    await interaction.deferReply().catch((err) => {
      console.error("Defer failed:", err);
    });

    const mode = interaction.options.getString("mode") || "kara";
    const forceStart = interaction.options.getBoolean("force") || false;

    await runMafiaLogic(interaction, mode, forceStart, true);
  },
};

// Shared core logic (now only used by slash)
async function runMafiaLogic(interaction, mode, forceStart) {
  const reply = async (firstArg, secondArg = {}) => {
    let options = {};

    if (typeof firstArg === "string") {
      options.content = firstArg;
      Object.assign(options, secondArg);
    } else if (typeof firstArg === "object" && firstArg !== null) {
      options = { ...firstArg, ...secondArg };
    } else {
      options = { ...secondArg };
    }

    // Convert old ephemeral syntax if someone accidentally left it
    if (options.ephemeral === true) {
      options.flags = (options.flags || 0) | MessageFlags.Ephemeral;
      delete options.ephemeral;
    } else if (options.ephemeral === false) {
      delete options.ephemeral;
    }

    // Since we always defer in execute, use editReply → fallback followUp
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply(options).catch((err) => {
        console.error("editReply failed:", err);
        return interaction.followUp(options);
      });
    }

    return interaction.reply(options);
  };

  const voiceChannel = interaction.member?.voice?.channel;

  if (!voiceChannel) {
    return reply("You must be in a voice channel to use this command.", {
      flags: MessageFlags.Ephemeral,
    });
  }

  const members = voiceChannel.members.filter((m) => !m.user.bot);
  const memberArray = [...members.values()];

  if (!forceStart && memberArray.length < 2) {
    return reply(
      "Not enough players (need at least 2 non-bot members). Use `force: true` to override.",
      { flags: MessageFlags.Ephemeral },
    );
  }

  // Rocket League mode
  if (mode === "rl") {
    const mafiaMember = members.random();

    try {
      await mafiaMember.send(
        "You are **Mafia**.\nTry to lose the game but don’t let others figure it out 😈",
      );
      await reply(`Mafia role assigned privately 👀 (Rocket League mode)`);
    } catch {
      await reply(
        `Could not DM ${mafiaMember.user.tag} — DMs probably closed.`,
      );
    }

    return;
  }

  // Karazhan / Raid Mafia mode
  const shuffled = [...memberArray].sort(() => 0.5 - Math.random());

  const totalPlayers = shuffled.length;
  const mafiaCount = Math.max(1, Math.floor(totalPlayers * 0.2));
  const jesterCount = Math.floor(totalPlayers * 0.1);

  const mafia = shuffled.slice(0, mafiaCount);
  const jester = shuffled.slice(mafiaCount, mafiaCount + jesterCount);
  const town = shuffled.slice(mafiaCount + jesterCount);

  const mafiaNames = mafia.map((m) => m.user.username).join(" & ");

  // Public embed
  const publicEmbed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle("🚨 Mafia Raid Started! 🚨")
    .setDescription(
      `Voice channel: **${voiceChannel.name}**\nPlayers: ${totalPlayers}`,
    )
    .addFields(
      {
        name: "Setup",
        value:
          `• **${mafiaCount} Mafia** — try to die 3 or more times during the raid (excluding wipes)\n` +
          `• **${jesterCount} Jester** — try to get voted as Mafia\n` +
          `• **${town.length} Town** — find the Mafia`,
        inline: false,
      },
      {
        name: "End of Raid – Voting",
        value:
          "Everyone votes for who they believe are Mafia.\n\n" +
          "**Majority = 50%+ votes on a player**\n\n" +
          "**Win conditions:**\n\n" +
          "**Jester wins**\n" +
          "• If they receive majority votes\n\n" +
          "**Mafia wins**\n" +
          "• Mafia who die 3 or more times and avoid majority vote\n\n" +
          "**Town wins**\n" +
          "• Players who successfully vote out one or more Mafia",
        inline: false,
      },
    )
    .setFooter({ text: "Roles sent privately • Good luck and have a chaotic raid!" })
    .setTimestamp();

  await reply({ embeds: [publicEmbed] });

  // Mafia DMs
  const mafiaText =
    `**${mafiaNames}** are **Mafia**.\n\n` +
    `Your goal: **Die 3 or more times** during the raid (excluding wipes).\n` +
    `Do NOT make it obvious you're trying to die!`;

  for (const m of mafia) {
    try {
      await m.send(mafiaText);
    } catch {
      await reply(`Could not DM Mafia: ${m.user.tag}`);
    }
  }

  // Jester DMs
  const jesterText =
    `You are the **Jester**.\n\n` +
    `Your goal: Make people think you're Mafia so they vote for you.`;

  for (const j of jester) {
    try {
      await j.send(jesterText);
    } catch {
      await reply(`Could not DM Jester: ${j.user.tag}`);
    }
  }

  // Town DMs
  const townText =
    `You are **Town**.\n\n` +
    `Try to figure out who the Mafia are and vote correctly at the end!`;

  for (const t of town) {
    try {
      await t.send(townText);
    } catch {
      // silent fail
    }
  }
}
