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
    // Scoreboard Buttons
    // ========================
    if (interaction.isButton()) {
      const customId = interaction.customId;

      try {
        await interaction.deferUpdate().catch(() => {});

        const scoreboardCommand = bot.client.commands.get("scoreboard");
        if (!scoreboardCommand) return;

        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) return;

        const parts = customId.split("_");
        const action = parts[1];
        const voiceChannelId = parts[2];
        const userId = parts[3];

        // Prevent interaction from other channels
        if (voiceChannel.id !== voiceChannelId) return;

        // ========================
        // +1 / -1
        // ========================
        if (action === "add" || action === "sub") {
          const amount = action === "add" ? 1 : -1;

          scoreboardCommand.updateScore(voiceChannelId, userId, amount);

          const members = voiceChannel.members.filter((m) => !m.user.bot);
          const { embeds, components: rows } =
            scoreboardCommand.createScoreboard(members, voiceChannel);

          await interaction.editReply({
            embeds,
            components: rows,
          });
        }

        // ========================
        // End Match
        // ========================
        else if (action === "endmatch") {
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
            .setDescription(`${winnerText}\n\n${finalText}`)
            .setFooter({ text: "Scores reset for next match" })
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
