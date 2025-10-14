import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { commands } from './commands';

config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error('❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env file');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

const commandData = commands.map(command => command.data.toJSON());

(async () => {
  try {
    console.log(`🔄 Started refreshing ${commandData.length} application (/) commands.`);

    let data: any;

    if (guildId) {
      // Register commands for a specific guild (faster for testing)
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandData },
      );
      console.log(`✅ Successfully registered ${data.length} guild commands for guild ${guildId}`);
    } else {
      // Register commands globally (takes up to 1 hour to propagate)
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandData },
      );
      console.log(`✅ Successfully registered ${data.length} global commands`);
      console.log('⏳ Note: Global commands may take up to 1 hour to appear everywhere');
    }

    console.log('\n📋 Registered commands:');
    commands.forEach(cmd => {
      console.log(`   - /${cmd.data.name}: ${cmd.data.description}`);
    });

  } catch (error) {
    console.error('❌ Error registering commands:', error);
    process.exit(1);
  }
})();
