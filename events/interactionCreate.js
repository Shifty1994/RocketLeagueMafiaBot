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

      if (!command?.execute) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction
            .reply({
              content: "This command is not implemented yet.",
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
        }
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error("Error executing slash command:", error);

        const replyMethod =
          interaction.replied || interaction.deferred ? "followUp" : "reply";

        await interaction[replyMethod]({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }

      return;
    }

    // ========================
    // Scoreboard Buttons
    // ========================
    if (interaction.isButton()) {
      const customId = interaction.customId;

      try {
        await interaction.deferUpdate();

        const scoreboardCommand = bot.client.commands.get("scoreboard");
        if (!scoreboardCommand) return;

        // ========================
        // +1 / -1 buttons
        // ========================
        if (
          customId.startsWith("score_add_") ||
          customId.startsWith("score_sub_")
        ) {
          const [, action, userId] = customId.split("_");
          const amount = action === "add" ? 1 : -1;

          // ✅ FIXED FUNCTION NAME
          scoreboardCommand.updateScore(userId, amount);

          // Refresh scoreboard
          const voiceChannel = interaction.member?.voice?.channel;
          if (!voiceChannel) return;

          const members = voiceChannel.members.filter((m) => !m.user.bot);
          const { content, rows } = scoreboardCommand.createScoreboard(members);

          await interaction.editReply({ content, components: rows });
        }

        // ========================
        // End match button
        // ========================
        else if (customId === "score_endmatch") {
          const voiceChannel = interaction.member?.voice?.channel;
          if (!voiceChannel) return;

          const members = voiceChannel.members.filter((m) => !m.user.bot);

          let finalText = "";
          let highest = -Infinity;
          let winners = [];

          members.forEach((member) => {
            const points = scoreboardCommand.getScores().get(member.id) || 0;

            if (points > highest) {
              highest = points;
              winners = [member.user.username];
            } else if (points === highest) {
              winners.push(member.user.username);
            }

            finalText += `• **${member.user.username}** — ${points} pts\n`;
          });

          const winnerText =
            winners.length === 1
              ? `🏆 Winner: **${winners[0]}** (${highest} pts)`
              : `🏆 Winners: **${winners.join(", ")}** (${highest} pts)`;

          const finalEmbed = new EmbedBuilder()
            .setColor(0x8b0000)
            .setTitle("🏁 Match Ended")
            .setDescription(`${winnerText}\n\n${finalText}`)
            .setFooter({ text: "Scores reset for next match" })
            .setTimestamp();

          await interaction.editReply({
            embeds: [finalEmbed],
            content: "**Match Finished!**",
            components: [],
          });

          scoreboardCommand.resetScores();
        }
      } catch (err) {
        console.error("Button error:", err);
      }

      return;
    }
  },
};
