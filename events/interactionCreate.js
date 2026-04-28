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
          await interaction.reply({
            content: "This command is not implemented yet.",
            flags: MessageFlags.Ephemeral,
          });
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
    // Buttons
    // ========================
    if (interaction.isButton()) {
      const customId = interaction.customId;

      try {
        await interaction.deferUpdate().catch(() => {});

        const scoreboardCommand = bot.client.commands.get("scoreboard");
        if (!scoreboardCommand) return;

        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) return;

        // ========================
        // PLAYER CLICK
        // ========================
        if (customId.startsWith("score_player_")) {
          const [, , voiceChannelId, userId] = customId.split("_");

          if (voiceChannel.id !== voiceChannelId) return;

          const mode = scoreboardCommand.getMode(voiceChannelId);
          const amount = mode === "add" ? 1 : -1;

          scoreboardCommand.updateScore(voiceChannelId, userId, amount);

          const members = voiceChannel.members.filter((m) => !m.user.bot);
          const { embeds, components } = scoreboardCommand.createScoreboard(
            members,
            voiceChannel,
          );

          await interaction.editReply({ embeds, components });
        }

        // ========================
        // TOGGLE MODE
        // ========================
        else if (customId.startsWith("score_toggle_")) {
          const [, , voiceChannelId] = customId.split("_");

          if (voiceChannel.id !== voiceChannelId) return;

          scoreboardCommand.toggleMode(voiceChannelId);

          const members = voiceChannel.members.filter((m) => !m.user.bot);
          const { embeds, components } = scoreboardCommand.createScoreboard(
            members,
            voiceChannel,
          );

          await interaction.editReply({ embeds, components });
        }

        // ========================
        // END MATCH
        // ========================
        else if (customId.startsWith("score_endmatch_")) {
          const [, , voiceChannelId] = customId.split("_");

          if (voiceChannel.id !== voiceChannelId) return;

          const members = voiceChannel.members.filter((m) => !m.user.bot);

          let finalText = "";
          let highest = -Infinity;
          let winners = [];

          members.forEach((member) => {
            const points =
              scoreboardCommand.getScores(voiceChannelId).get(member.id) || 0;

            if (points > highest) {
              highest = points;
              winners = [member.displayName];
            } else if (points === highest) {
              winners.push(member.displayName);
            }

            finalText += `• **${member.displayName}** — ${points} pts\n`;
          });

          const winnerText =
            winners.length === 1
              ? `🏆 Winner: **${winners[0]}** (${highest} pts)`
              : `🏆 Winners: **${winners.join(", ")}** (${highest} pts)`;

          const embed = new EmbedBuilder()
            .setColor(0x8b0000)
            .setTitle("🏁 Match Ended")
            .setDescription(
              `📍 Voice Channel: **${voiceChannel.name}**\n\n${winnerText}\n\n${finalText}`,
            )
            .setFooter({ text: "Scores have been reset for the next match" })
            .setTimestamp();

          await interaction.editReply({
            embeds: [embed],
            content: "**Match Finished!**",
            components: [],
          });

          scoreboardCommand.resetScores(voiceChannelId);
        }
      } catch (err) {
        console.error("Button error:", err);
      }

      return;
    }
  },
};
