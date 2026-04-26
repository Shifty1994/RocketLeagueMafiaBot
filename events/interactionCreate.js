const { MessageFlags } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  run: async (bot, interaction) => {
    // Handle slash commands
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

    // Handle scoreboard buttons
    if (interaction.isButton()) {
      const customId = interaction.customId;

      try {
        await interaction.deferUpdate();

        if (
          customId.startsWith("score_add_") ||
          customId.startsWith("score_sub_")
        ) {
          const [, action, userId] = customId.split("_");
          const amount = action === "add" ? 1 : -1;

          const roundendCommand = bot.client.commands.get("roundend");
          if (roundendCommand?.updateScoreboard) {
            roundendCommand.updateScoreboard(userId, amount);
          }

          // Refresh the scoreboard
          const voiceChannel = interaction.member?.voice?.channel;
          if (voiceChannel) {
            const members = voiceChannel.members.filter((m) => !m.user.bot);
            const roundend = bot.client.commands.get("roundend");
            const { embed, rows } = roundend.createScoreboardEmbed(members);

            await interaction.editReply({ embeds: [embed], components: rows });
          }
        } else if (customId === "score_reset") {
          const roundendCommand = bot.client.commands.get("roundend");
          if (roundendCommand?.resetScoreboard) {
            roundendCommand.resetScoreboard();
          }

          await interaction.editReply({
            content: "✅ Match ended! All scores have been reset.",
            embeds: [],
            components: [],
          });
        }
      } catch (err) {
        console.error("Button error:", err);
      }
      return;
    }
  },
};
