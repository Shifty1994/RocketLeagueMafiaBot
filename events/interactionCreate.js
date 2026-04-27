const { MessageFlags, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  run: async (bot, interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = bot.client.commands.get(
        interaction.commandName.toLowerCase(),
      );

      if (!command?.execute) {
        return interaction
          .reply({
            content: "This command is not implemented yet.",
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => {});
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);

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
    // BUTTONS
    // ========================
    if (interaction.isButton()) {
      const customId = interaction.customId;

      try {
        await interaction.deferUpdate();

        const scoreboardCommand = bot.client.commands.get("scoreboard");
        if (!scoreboardCommand) return;

        // ➕➖
        if (
          customId.startsWith("score_add_") ||
          customId.startsWith("score_sub_")
        ) {
          const [, action, userId] = customId.split("_");
          const amount = action === "add" ? 1 : -1;

          scoreboardCommand.updateScore(userId, amount);

          const voiceChannel = interaction.member?.voice?.channel;
          if (!voiceChannel) return;

          const members = voiceChannel.members.filter((m) => !m.user.bot);

          const { content, rows } = scoreboardCommand.createScoreboard(members);

          await interaction.editReply({ content, components: rows });
        }

        // 🏁 END MATCH
        else if (customId === "score_endmatch") {
          const voiceChannel = interaction.member?.voice?.channel;
          if (!voiceChannel) return;

          const members = voiceChannel.members.filter((m) => !m.user.bot);

          let finalText = "";
          let highest = -Infinity;
          let winners = [];

          members.forEach((member) => {
            const username = member.displayName;
            const points = scoreboardCommand.getScores().get(member.id) || 0;

            if (points > highest) {
              highest = points;
              winners = [username];
            } else if (points === highest) {
              winners.push(username);
            }

            finalText += `• **${username}** — ${points} pts\n`;
          });

          const winnerText =
            winners.length === 1
              ? `🏆 **${winners[0]} wins!** (${highest} pts)`
              : `🏆 **Tie:** ${winners.join(", ")} (${highest} pts)`;

          const embed = new EmbedBuilder()
            .setColor(0x8b0000)
            .setTitle("🏁 Game Over")
            .setDescription(`${winnerText}\n\n${finalText}`)
            .setTimestamp();

          await interaction.editReply({
            content: "**Match Finished!**",
            embeds: [embed],
            components: [],
          });

          scoreboardCommand.resetScores();
        }
      } catch (err) {
        console.error(err);
      }
    }
  },
};
