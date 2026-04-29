require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // only needed for guild deploy
const deployMode = process.env.DEPLOY_MODE || "global"; // "guild" or "global"

if (!token || !clientId) {
  console.error("❌ Missing TOKEN or CLIENT_ID in .env");
  process.exit(1);
}

if (deployMode === "guild" && !guildId) {
  console.error("❌ GUILD_ID is required for guild deploy mode");
  process.exit(1);
}

const commands = [];

// Load commands
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
      console.log(`⚠️ Skipping ${file} (missing data/execute)`);
    }
  }
}

if (commands.length === 0) {
  console.error("❌ No commands found.");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(`🔄 Loaded ${commands.length} command(s).`);

    if (deployMode === "guild") {
      console.log("⚡ Deploying to TEST GUILD (instant update)");

      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });

      console.log("✅ Guild commands deployed instantly.");
    } else {
      console.log("🌍 Deploying GLOBAL commands (can take up to 1 hour)");

      await rest.put(Routes.applicationCommands(clientId), { body: commands });

      console.log("✅ Global commands deployed.");
    }

    console.log(`🕒 Finished at: ${new Date().toISOString()}`);
  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error);
  }
})();
