// deploy-commands.js
require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // optional – for fast guild testing

if (!token || !clientId) {
  console.error(
    "Missing required environment variables: TOKEN and/or CLIENT_ID",
  );
  console.log("Please check your .env file and make sure it contains:");
  console.log("TOKEN=your-bot-token-here");
  console.log("CLIENT_ID=your-application-id-here");
  process.exit(1);
}

const commands = [];

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

if (commands.length === 0) {
  console.error("No valid slash commands found. Aborting deployment.");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    let data;

    if (guildId) {
      console.log(`→ Deploying to guild ${guildId} (instant update)`);
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        {
          body: commands,
        },
      );
    } else {
      console.log(
        "→ Deploying globally (may take up to 1 hour to appear everywhere)",
      );
      data = await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
    }

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
    console.log("Deployment finished at:", new Date().toISOString());
  } catch (error) {
    console.error("Deployment failed:");
    console.error(error);
  }
})();
