// deploy-commands.js
require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error("❌ Missing TOKEN or CLIENT_ID in .env file");
  process.exit(1);
}

const commands = [];

// Load all commands from the commands folder
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
      console.log(`[WARNING] ${filePath} is missing "data" or "execute"`);
    }
  }
}

if (commands.length === 0) {
  console.error("❌ No commands found!");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(
      `🔄 Found ${commands.length} command(s). Preparing deployment...`,
    );

    // 1. Clear ALL old global commands (this fixes duplicates and old versions)
    console.log("🗑️ Clearing all old global commands...");
    await rest.put(Routes.applicationCommands(clientId), { body: [] });

    // 2. Deploy the new commands globally
    console.log("🚀 Deploying latest commands globally...");
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log(`✅ Successfully deployed ${data.length} commands globally!`);
    console.log("   → New servers will now get the latest version.");
    console.log(`   Deployment finished at: ${new Date().toISOString()}`);
  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error);
  }
})();
