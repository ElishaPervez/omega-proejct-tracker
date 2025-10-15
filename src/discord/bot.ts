import { Client, GatewayIntentBits, Events, Collection, Interaction } from 'discord.js';
import { config } from 'dotenv';
import { prisma } from '../lib/prisma';
import { commands } from './commands';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ],
});

// Store commands in a collection
const commandCollection = new Collection();
commands.forEach(command => {
  commandCollection.set(command.data.name, command);
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Discord bot ready! Logged in as ${c.user.tag}`);
  console.log(`📊 Serving ${commandCollection.size} commands`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  // Handle autocomplete interactions
  if (interaction.isAutocomplete()) {
    try {
      const { commandName, options } = interaction;
      const focusedOption = options.getFocused(true);

      // Find user for autocomplete
      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });

      if (!user) {
        await interaction.respond([]);
        return;
      }

      let choices: { name: string; value: string }[] = [];

      // Handle different autocomplete options
      if (focusedOption.name === 'title') {
        // Project or side project titles
        if (commandName === 'project') {
          const projects = await prisma.project.findMany({
            where: {
              userId: user.id,
              title: { contains: focusedOption.value as string },
            },
            select: { title: true },
            take: 25,
          });
          choices = projects.map(p => ({ name: p.title, value: p.title }));
        } else if (commandName === 'sideproject') {
          const sideProjects = await prisma.sideProject.findMany({
            where: {
              userId: user.id,
              title: { contains: focusedOption.value as string },
            },
            select: { title: true },
            take: 25,
          });
          choices = sideProjects.map(p => ({ name: p.title, value: p.title }));
        }
      } else if (focusedOption.name === 'name') {
        // Client names
        const clients = await prisma.client.findMany({
          where: {
            userId: user.id,
            name: { contains: focusedOption.value as string },
          },
          select: { name: true },
          take: 25,
        });
        choices = clients.map(c => ({ name: c.name, value: c.name }));
      } else if (focusedOption.name === 'client') {
        // Client names for project creation
        const clients = await prisma.client.findMany({
          where: {
            userId: user.id,
            name: { contains: focusedOption.value as string },
          },
          select: { name: true },
          take: 25,
        });
        choices = clients.map(c => ({ name: c.name, value: c.name }));
      } else if (focusedOption.name === 'invoice_number') {
        // Invoice numbers
        const invoices = await prisma.invoice.findMany({
          where: {
            userId: user.id,
            invoiceNumber: { contains: focusedOption.value as string },
          },
          select: { invoiceNumber: true },
          take: 25,
        });
        choices = invoices.map(i => ({ name: i.invoiceNumber, value: i.invoiceNumber }));
      }

      await interaction.respond(choices);
    } catch (error) {
      console.error('Error handling autocomplete:', error);
      await interaction.respond([]);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commandCollection.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    // Defer reply immediately to prevent timeout (we have 3 seconds to respond)
    await interaction.deferReply({ ephemeral: true });

    // Find or create user based on Discord ID
    let user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          discordId: interaction.user.id,
          discordUsername: interaction.user.username,
          name: interaction.user.username,
        },
      });
      console.log(`✅ Created new user: ${user.discordUsername}`);
    }

    // Execute command with user context
    await command.execute(interaction, user);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);

    const errorMessage = {
      content: '❌ There was an error executing this command!',
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply({ ...errorMessage, ephemeral: true });
    }
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN is not set in .env file');
  process.exit(1);
}

client.login(token).catch((error) => {
  console.error('❌ Failed to login to Discord:', error);
  process.exit(1);
});
