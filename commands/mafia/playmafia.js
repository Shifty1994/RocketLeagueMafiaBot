module.exports = {
  name: "playmafia",
  category: "mafia",
  description:
    "Assigns mafia roles in the current voice channel (old or classic | new mode)",
  permissions: [],
  devOnly: false,
  run: async ({ client, message, args }) => {
    const voiceChannel = message.member?.voice?.channel;

    if (!voiceChannel) {
      return message.channel.send(
        "You must be in a voice channel to use this command.",
      );
    }

    const members = voiceChannel.members.filter((m) => !m.user.bot); // exclude bots
    const memberArray = [...members.values()];

    if (memberArray.length < 4) {
      return message.channel.send(
        "Not enough players (need at least 4 non-bot members).",
      );
    }

    const mode = args[0]?.toLowerCase() === "new" ? "new" : "classic";

    // ────────────────────────────────────────────────
    //                Classic mode (1 mafia)
    // ────────────────────────────────────────────────
    if (mode === "classic") {
      const mafiaMember = members.random();

      try {
        await mafiaMember.send(
          "You are **Mafia**.\n" +
            "Try to lose the game but don't let others figure it out 😈",
        );
        await message.channel.send(
          `Mafia role assigned privately 👀 (classic mode)`,
        );
      } catch (err) {
        await message.channel.send(
          `Could not DM ${mafiaMember.user.tag} — DMs probably closed.`,
        );
      }
      return;
    }

    // ────────────────────────────────────────────────
    //             New mode (2 Mafia + 1 Jester)
    // ────────────────────────────────────────────────

    // Shuffle players
    const shuffled = memberArray.sort(() => Math.random() - 0.5);
    const mafia1 = shuffled[0];
    const mafia2 = shuffled[1];
    const jester = shuffled[2];

    const mafiaNames = [mafia1, mafia2]
      .map((m) => m.user.username)
      .sort()
      .join(" & ");

    // ─── Public announcement (rules everyone should know) ───
    const publicEmbed = {
      color: 0x8b0000, // dark red
      title: "🚨 Mafia Raid Started! 🚨",
      description: `Voice channel: **${voiceChannel.name}**\nPlayers: ${memberArray.length}`,
      fields: [
        {
          name: "Setup",
          value:
            "• 2 **Mafia** — trying to die 3 or more times (excluding wipes with 5+ deaths)\n" +
            "• 1 **Jester** — wants you to think they're Mafia\n" +
            "• Everyone else → **Town**",
          inline: false,
        },
        {
          name: "End of Raid – Voting",
          value:
            "Everyone votes for **exactly 2 suspects** you think are Mafia.\n\n" +
            "- **Majority = 5 or more votes** on one player\n" +
            "- Gold is split evenly between **all winners**\n\n" +
            "**Win outcomes:**\n\n" +
            "- **Jester wins**  \n" +
            "  → Gets **5+ votes** (majority)  \n" +
            "  → Jester steals some of the gold (split evenly between all winners)\n\n" +
            "- **Mafia wins (individual)**  \n" +
            "  → Each Mafia who receives **4 or fewer votes** & **died 3 or more times**  \n" +
            "  → Surviving Mafia who avoided majority vote **share the gold**\n\n" +
            "- **Town wins (individual)**  \n" +
            "  → Each Town player who **successfully voted for 1 or 2 Mafia** with majority (5 or more votes each)  \n" +
            "  → All Town players who meet this condition **share the gold**",
          inline: false,
        },
      ],
      footer: {
        text: "Roles sent privately • No metagaming • Good luck!",
      },
      timestamp: new Date(),
    };

    await message.channel.send({ embeds: [publicEmbed] });

    // ─── Mafia DM ──────────────────────────────────────────
    const mafiaText =
      `**${mafiaNames}** are **Mafia**.\n\n` +
      `Your goal: **Die 3 or more times** during the raid (excluding wipes with 5+ deaths).\n` +
      `Do NOT make it obvious you're trying to die!`;

    try {
      await mafia1.send(mafiaText);
    } catch {
      await message.channel.send(`Could not DM Mafia: ${mafia1.user.tag}`);
    }
    try {
      await mafia2.send(mafiaText);
    } catch {
      await message.channel.send(`Could not DM Mafia: ${mafia2.user.tag}`);
    }

    // ─── Jester DM ─────────────────────────────────────────
    const jesterText =
      `You are the **Jester**.\n\n` +
      `Your goal: Make people think you're Mafia so they vote for you at the end.\n`;

    try {
      await jester.send(jesterText);
    } catch {
      await message.channel.send(`Could not DM Jester: ${jester.user.tag}`);
    }

    // ─── Town DM ───────────────────────────────────────────
    const townText =
      `You are **Town**.\n\n` +
      `Try to figure out who the Mafia are and vote correctly at the end!`;

    for (const member of memberArray) {
      if (
        member.id === mafia1.id ||
        member.id === mafia2.id ||
        member.id === jester.id
      ) {
        continue;
      }

      try {
        await member.send(townText);
      } catch {
        // silent fail - most people have DMs open anyway
      }
    }

    // ─── Final channel message ─────────────────────────────
    await message.channel.send(
      `Roles assigned privately.\n` + `Good luck and have a chaotic raid! 🔥`,
    );
  },
};
