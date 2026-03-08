const { MessageFlags } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  run: async (bot, interaction) => {
    if (!interaction.isChatInputCommand()) return;

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
  },
};
