const { MessageFlags, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  run: async (bot, interaction) => {
    // ========================
    // Slash Commands
    // ========================
    if (interaction.isChatInputCommand()) {
      const command = bot.client.commands.get(
        interaction.commandName.toLowerCase(),
      );

      if (!command?.execute) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);

        const replyMethod =
          interaction.replied || interaction.deferred ? "followUp" : "reply";

        await interaction[replyMethod]({
          content: "Error executing command.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }

      return;
    }

    // ========================
    // BUTTONS
    // ========================
    if (interaction.isButton()) {
      const customId = interaction.customId;

      try {
        await interaction.deferUpdate().catch(() => {});

        const scoreboardCommand = bot.client.commands.get("scoreboard");
        if (!scoreboardCommand) return;

        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) return;

        const vcId = voiceChannel.id;

        // ========================
        // PLAYER CLICK
        // ========================
        if (customId.startsWith("score_player_")) {
          const [, , voiceChannelId, userId] = customId.split("_");
          if (vcId !== voiceChannelId) return;

          const mode = scoreboardCommand.getMode(vcId);
          const amount = mode === "add" ? 1 : -1;

          scoreboardCommand.updateScore(vcId, userId, amount);

          const members = voiceChannel.members.filter((m) => !m.user.bot);

          const { embeds, components } = scoreboardCommand.createScoreboard(
            members,
            voiceChannel,
          );

          return interaction.editReply({ embeds, components });
        }

        // ========================
        // NEXT PAGE
        // ========================
        if (customId.startsWith("score_next_")) {
          const [, , voiceChannelId] = customId.split("_");
          if (vcId !== voiceChannelId) return;

          const current = scoreboardCommand.getPage(vcId);
          scoreboardCommand.setPage(vcId, current + 1);
        }

        // ========================
        // PREV PAGE
        // ========================
        if (customId.startsWith("score_prev_")) {
          const [, , voiceChannelId] = customId.split("_");
          if (vcId !== voiceChannelId) return;

          const current = scoreboardCommand.getPage(vcId);
          scoreboardCommand.setPage(vcId, Math.max(0, current - 1));
        }

        // ========================
        // TOGGLE MODE
        // ========================
        if (customId.startsWith("score_toggle_")) {
          const [, , voiceChannelId] = customId.split("_");
          if (vcId !== voiceChannelId) return;

          scoreboardCommand.toggleMode(vcId);
        }

        // ========================
        // END MATCH
        // ========================
        if (customId.startsWith("score_endmatch_")) {
          const [, , voiceChannelId] = customId.split("_");
          if (vcId !== voiceChannelId) return;

          const members = voiceChannel.members.filter((m) => !m.user.bot);
          const scoresMap = scoreboardCommand.getScores(vcId);

          // Build leaderboard array
          const results = [];

          for (const member of members.values()) {
            const points = scoresMap.get(member.id) || 0;

            results.push({
              name: member.displayName,
              points,
            });
          }

          // Sort highest first
          results.sort((a, b) => b.points - a.points);

          const highest = results[0]?.points ?? 0;
          const winners = results.filter((p) => p.points === highest);

          const winnerText =
            winners.length === 1
              ? `🏆 **Winner:** ${winners[0].name} (${highest} pts)`
              : `🏆 **Winners:** ${winners.map((w) => w.name).join(", ")} (${highest} pts)`;

          const leaderboardText = results
            .map((p, i) => {
              const medal =
                i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•";

              return `${medal} **${p.name}** — ${p.points} pts`;
            })
            .join("\n");

          const embed = new EmbedBuilder()
            .setColor(0x8b0000)
            .setTitle("🏁 Match Ended")
            .setDescription(
              `📍 **Voice Channel:** ${voiceChannel.name}\n\n` +
                `${winnerText}\n\n` +
                `📊 **Final Standings:**\n${leaderboardText}`,
            )
            .setFooter({ text: "Scores have been reset for the next match" })
            .setTimestamp();

          await interaction.editReply({
            embeds: [embed],
            content: null,
            components: [],
          });

          scoreboardCommand.resetScores(vcId);
          return;
        }

        // ========================
        // REFRESH UI (for paging/toggle)
        // ========================
        const members = voiceChannel.members.filter((m) => !m.user.bot);

        const { embeds, components } = scoreboardCommand.createScoreboard(
          members,
          voiceChannel,
        );

        await interaction.editReply({ embeds, components });
      } catch (err) {
        console.error("Button error:", err);
      }
    }
  },
};
