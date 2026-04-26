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
          "Game mode: kara (death), sabotage (missions), simple (single mafia)",
        )
        .setRequired(false)
        .addChoices(
          { name: "Classic Karazhan (death-based)", value: "kara" },
          { name: "Karazhan Sabotage (missions)", value: "sabotage" },
          { name: "Simple Mafia (single mafia)", value: "simple" },
        ),
    )
    .addBooleanOption((option) =>
      option
        .setName("force")
        .setDescription("Force start even with fewer than 2 players")
        .setRequired(false),
    ),

  async execute(interaction) {
    const mode = interaction.options.getString("mode") || "kara";
    const forceStart = interaction.options.getBoolean("force") || false;

    // Simple defer - this worked before
    await interaction.deferReply().catch((err) => {
      console.error("Defer failed:", err);
    });

    console.log(
      `[${new Date().toISOString()}] /playmafia used | mode: ${mode} | force: ${forceStart}`,
    );

    await runMafiaLogic(interaction, mode, forceStart);
  },
};

// Shared core logic
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

    // Simple version - no forced ephemeral
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

  // ────────────────────────────────────────────────
  //                Simple Mafia Mode (Single Mafia)
  // ────────────────────────────────────────────────
  if (mode === "simple" || mode === "rl") {
    const mafiaMember = members.random();

    try {
      await mafiaMember.send(
        "You are **Mafia**.\n\n" +
          "Your goal: Try to lose/throw the game without getting caught.\n",
      );

      // Clean public embed with new scoring
      const simpleEmbed = new EmbedBuilder()
        .setColor(0x8b0000)
        .setTitle("🕵️ Simple Mafia Mode Activated!")
        .setDescription(
          `A single **Mafia** has been chosen and received their role via DM.\n\n` +
            `**How to play:**\n` +
            `• The Mafia tries to lose/throw the game without being obvious.\n` +
            `• At the end of each round/game, everyone votes who they think the Mafia is.\n\n` +
            `**Example of Scoring:**\n` +
            `• Each player gets **1 point** for winning the game (except the Mafia)\n` +
            `• Each player gets **1 point** for correctly guessing the Mafia\n` +
            `• The **Mafia** gets **3 points** if they lose the game AND avoid majority votes`,
        )
        .setFooter({
          text: "One person is the traitor. Good luck!",
        })
        .setTimestamp();

      await reply({ embeds: [simpleEmbed] });
    } catch {
      await reply(`Could not DM the chosen Mafia — DMs probably closed.`);
    }

    return;
  }

  const totalPlayers = memberArray.length;

  // Karazhan Sabotage mode
  if (mode === "sabotage") {
    const mafiaCount = Math.max(1, Math.floor(totalPlayers * 0.2));
    const jesterCount = Math.floor(totalPlayers * 0.1);

    const shuffled = [...memberArray].sort(() => 0.5 - Math.random());
    const mafia = shuffled.slice(0, mafiaCount);
    const jester = shuffled.slice(mafiaCount, mafiaCount + jesterCount);
    const town = shuffled.slice(mafiaCount + jesterCount);

    const mafiaNames = mafia.map((m) => m.user.username).join(" & ");

    const publicEmbed = new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle("🚨 Karazhan Sabotage Started! 🚨")
      .setDescription(
        `Voice channel: **${voiceChannel.name}**\nPlayers: ${totalPlayers}\n` +
          `Mafia: **${mafiaCount}** | Jester: **${jesterCount}**`,
      )
      .addFields(
        {
          name: "How Sabotage Works",
          value:
            "This mode is **mission/objective-based**.\n" +
            "There are **10 objectives**.\n\n" +
            "**Mafia wins** if they complete **8 or more** objectives together, and not get found out.\n" +
            "**Town wins** if they complete **1 or more** objectives **AND** correctly vote out at least one Mafia at the end.\n" +
            "**Jester wins** if they receive majority votes at the end.\n\n" +
            "**End of raid voting**: Everyone gets **as many votes as there are Mafia** (e.g. 2 Mafia = 2 votes each).",
          inline: false,
        },
        {
          name: "The 10 Objectives",
          value:
            "1. **Skim the Loot** — take extra loot without anyone noticing\n" +
            "2. **Silent Saboteur** — be the lowest DPS on at least one boss\n" +
            "3. **Accidental Pull** — pull an extra pack without wiping the raid\n" +
            "4. **Cold-Blooded** — let one player die “by accident” without it being obvious\n" +
            "5. **Die Once** — die once during a boss fight\n" +
            "6. **Fake Hero** — take credit for something you didn’t do\n" +
            "7. **Lost in the Job** — position badly so healers have to work extra\n" +
            "8. **Confidently Wrong** — say something confidently that is completely wrong\n" +
            "9. **Trust Issues** — subtly question another player’s performance or callouts\n" +
            "10. **Callout Echo** — repeat a correct callout 1–2 seconds too late",
          inline: false,
        },
      )
      .setFooter({ text: "Roles sent privately • Good luck and stay sneaky!" })
      .setTimestamp();

    await reply({ embeds: [publicEmbed] });

    const mafiaText =
      `**${mafiaNames}** are **Mafia** in **Sabotage** mode.\n\n` +
      `Goal: Complete **8 or more** of the 10 objectives together (team total).\n` +
      `One of you can do many, or split them.\n` +
      `Don't be too obvious so town doesn't suspect you.\n`;

    for (const m of mafia) {
      try {
        await m.send(mafiaText);
      } catch {
        await reply(`Could not DM Mafia: ${m.user.tag}`);
      }
    }

    const jesterText =
      `You are the **Jester**.\n\n` +
      `Your goal: Make people think you're Mafia so they vote for you at the end.\n`;

    for (const j of jester) {
      try {
        await j.send(jesterText);
      } catch {
        await reply(`Could not DM Jester: ${j.user.tag}`);
      }
    }

    const townText =
      `You are **Town** in **Sabotage** mode.\n\n` +
      `Goal: Complete **at least 1** objective **AND** correctly vote out at least one Mafia at the end.\n` +
      `Mafia wins if they complete 8+ objectives together and you don't vote them out.\n` +
      `Jester wins if voted as Mafia.\n` +
      `Keep your eyes peeled for suspicious behavior!`;

    for (const t of town) {
      try {
        await t.send(townText);
      } catch {
        // silent
      }
    }

    await reply(
      "Sabotage roles assigned privately.\nGood luck and stay sneaky! 🕵️",
    );
    return;
  }

  // Classic Karazhan mode (default)
  const shuffled = [...memberArray].sort(() => 0.5 - Math.random());

  const mafiaCount = Math.max(1, Math.floor(totalPlayers * 0.2));
  const jesterCount = Math.floor(totalPlayers * 0.1);

  const mafia = shuffled.slice(0, mafiaCount);
  const jester = shuffled.slice(mafiaCount, mafiaCount + jesterCount);
  const town = shuffled.slice(mafiaCount + jesterCount);

  const mafiaNames = mafia.map((m) => m.user.username).join(" & ");

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
    .setFooter({
      text: "Roles sent privately • Good luck and have a chaotic raid!",
    })
    .setTimestamp();

  await reply({ embeds: [publicEmbed] });

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

  const jesterText = `You are the **Jester**.\n\nYour goal: Make people think you're Mafia so they vote for you.`;

  for (const j of jester) {
    try {
      await j.send(jesterText);
    } catch {
      await reply(`Could not DM Jester: ${j.user.tag}`);
    }
  }

  const townText = `You are **Town**.\n\nTry to figure out who the Mafia are and vote correctly at the end!`;

  for (const t of town) {
    try {
      await t.send(townText);
    } catch {
      // silent fail
    }
  }

  await reply(
    "Roles assigned privately.\nGood luck and have a chaotic raid! 🔥",
  );
}
