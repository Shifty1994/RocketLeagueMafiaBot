module.exports = {
  name: "playmafia",
  category: "mafia",
  description: "Assigns mafia roles in the current voice channel (old or new mode)",
  permissions: [],
  devOnly: false,
  run: async ({ client, message, args }) => {
    const voiceChannel = message.member?.voice?.channel;

    if (!voiceChannel) {
      return message.channel.send("You must be in a voice channel to use this command.");
    }

    const members = voiceChannel.members.filter(m => !m.user.bot); // exclude bots
    const memberArray = [...members.values()];

    if (memberArray.length < 4) {
      return message.channel.send("Not enough players (need at least 4 non-bot members).");
    }

    const mode = args[0]?.toLowerCase() === "new" ? "new" : "classic";

    // ────────────────────────────────────────────────
    //                Classic mode (1 mafia)
    // ────────────────────────────────────────────────
    if (mode === "classic") {
      const mafiaMember = members.random();

      try {
        await mafiaMember.send(
          "You are **mafia**.\n" +
          "Try to loose the game but dont let others figure it out 😈"
        );
        message.channel.send(`Mafia roles have been assigned privately 👀 (${mode} mode)`);
      } catch (err) {
        message.channel.send(
          `Could not DM ${mafiaMember.user.tag} — they probably have DMs closed.`
        );
      }

      return;
    }

    // ────────────────────────────────────────────────
    //                  New mode (2 mafia + 1 jester)
    // ────────────────────────────────────────────────
    // Shuffle players
    const shuffled = memberArray.sort(() => Math.random() - 0.5);

    const mafia1 = shuffled[0];
    const mafia2 = shuffled[1];
    const jester = shuffled[2];

    const mafiaNames = [mafia1.user.username, mafia2.user.user.username].sort().join(" & ");

    // ─── Send messages to Mafia ───────────────────────
    const mafiaText = 
      `You and **${mafiaNames}** are **Mafia**.\n` +
      `Your goal is to **die 3 times** during the raid (excluding wipes 5+ deaths).\n` +
      `You can't make it obvious!\n\n` +
      `At the end of the raid everyone will vote on **2 people** they think are the mafia.\n` +
      `(But don't vote on the Jester or he will get all the gold)`;

    try {
      await mafia1.send(mafiaText);
    } catch {
      message.channel.send(`Could not DM ${mafia1.user.tag} (Mafia)`);
    }

    try {
      await mafia2.send(mafiaText);
    } catch {
      message.channel.send(`Could not DM ${mafia2.user.tag} (Mafia)`);
    }

    // ─── Send message to Jester ───────────────────────
    const jesterText =
      `You are the **Jester**.\n` +
      `Your goal is to make people think you're Mafia (so they vote you at the end).\n` +
      `If people vote you → you win big (all the gold).\n` +
      `If they vote the real mafia → mafia wins.\n\n` +
      `Good luck and be chaotic 😈`;

    try {
      await jester.send(jesterText);
    } catch {
      message.channel.send(`Could not DM ${jester.user.tag} (Jester)`);
    }

    // ─── Send message to everyone else (Town) ─────────
    const townText =
      `There are **3 impostors** among you:\n` +
      `→ 2 **Mafia** that will try to die **3 times** during the raid (excl. wipes 5+ dies)\n` +
      `→ 1 **Jester** that will try to make you think he's mafia\n\n` +
      `At the end of the raid everyone will vote on **2 people** who they think are the mafia.\n` +
      `(But **don't vote on the Jester** or he will get all the gold)`;

    for (const member of memberArray) {
      // skip the roles we've already messaged
      if (member.id === mafia1.id || member.id === mafia2.id || member.id === jester.id) {
        continue;
      }

      try {
        await member.send(townText);
      } catch {
        // silent fail — most people have DMs open anyway
      }
    }

    // ─── Announce in channel ──────────────────────────
    message.channel.send(
      `**New Mafia mode** activated in **${voiceChannel.name}** 👀\n` +
      `Roles have been sent privately.\n` +
      `Good luck and have fun!`
    );
  },
};