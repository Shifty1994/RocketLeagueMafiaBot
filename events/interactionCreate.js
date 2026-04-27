const { MessageFlags, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  run: async (bot, interaction) => {
    // Slash Commands
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
    // Scoreboard Buttons - Simple Version
    // ========================
    if (interaction.isButton()) {
      const customId = interaction.customId;

      try {
        await interaction.deferUpdate().catch(() => {});

        const scoreboardCommand = bot.client.commands.get("scoreboard");
        if (!scoreboardCommand) {
          console.log("Scoreboard command not found");
          return;
        }

        const guildId = interaction.guild?.id;
        if (!guildId) return;

        console.log(`Button pressed: ${customId}`); // ← Debug line

        if (
          customId.startsWith("score_add_") ||
          customId.startsWith("score_sub_")
        ) {
          const [, action, userId] = customId.split("_");
          const amount = action === "add" ? 1 : -1;

          scoreboardCommand.updateScore(guildId, userId, amount);

          const voiceChannel = interaction.member?.voice?.channel;
          if (voiceChannel) {
            const members = voiceChannel.members.filter((m) => !m.user.bot);
            const { content, rows } = scoreboardCommand.createScoreboard(
              members,
              guildId,
            );

            await interaction
              .editReply({ content, components: rows })
              .catch(() => {});
          }
        } else if (customId === "score_endmatch") {
          const voiceChannel = interaction.member?.voice?.channel;
          if (!voiceChannel) return;

          const members = voiceChannel.members.filter((m) => !m.user.bot);

          let finalText = "";
          members.forEach((member) => {
            const points =
              scoreboardCommand.getScores(guildId).get(member.id) || 0;
            finalText += `• **${member.user.username}** — ${points} pts\n`;
          });

          const embed = new EmbedBuilder()
            .setColor(0x8b0000)
            .setTitle("🏁 Match Ended")
            .setDescription(finalText || "No players")
            .setFooter({ text: "Scores have been reset for the next match" })
            .setTimestamp();

          await interaction
            .editReply({
              embeds: [embed],
              content: "**Match Finished!** Here are the final scores:",
              components: [],
            })
            .catch(() => {});

          scoreboardCommand.resetScores(guildId);
        }
      } catch (err) {
        console.error("Button error:", err);
      }
      return;
    }
  },
};
