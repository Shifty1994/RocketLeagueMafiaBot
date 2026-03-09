// deploy-commands.js
require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error("Missing required env: TOKEN and/or CLIENT_ID");
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
        `[WARNING] Command at ${filePath} missing "data" or "execute"`,
      );
    }
  }
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} global application (/) commands.`,
    );

    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log(
      `Successfully reloaded ${data.length} global application (/) commands.`,
    );
    console.log(
      "Note: Global commands may take up to 1 hour to appear everywhere.",
    );
  } catch (error) {
    console.error(error);
  }
})();
