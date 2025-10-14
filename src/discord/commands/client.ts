import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export const clientCommand = {
  data: new SlashCommandBuilder()
    .setName('client')
    .setDescription('Manage your clients')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a new client')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Client name')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('email')
            .setDescription('Client email')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('company')
            .setDescription('Company name')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all your clients')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View client details')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Client name (partial match)')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, user: User) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'add':
        await handleAdd(interaction, user);
        break;
      case 'list':
        await handleList(interaction, user);
        break;
      case 'view':
        await handleView(interaction, user);
        break;
    }
  },
};

async function handleAdd(interaction: ChatInputCommandInteraction, user: User) {
  const name = interaction.options.getString('name', true);
  const email = interaction.options.getString('email');
  const company = interaction.options.getString('company');

  const client = await prisma.client.create({
    data: {
      name,
      email,
      company,
      userId: user.id,
    },
  });

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('✅ Client Added')
    .setDescription(`**${client.name}**`)
    .setTimestamp();

  if (email) embed.addFields({ name: 'Email', value: email, inline: true });
  if (company) embed.addFields({ name: 'Company', value: company, inline: true });

  await interaction.reply({ embeds: [embed] });
}

async function handleList(interaction: ChatInputCommandInteraction, user: User) {
  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    include: {
      projects: {
        select: {
          id: true,
          status: true,
        },
      },
      invoices: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (clients.length === 0) {
    await interaction.reply({
      content: '📋 No clients found. Add one with `/client add`',
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('👥 Your Clients')
    .setDescription(`Total: ${clients.length} client(s)`)
    .setTimestamp();

  clients.slice(0, 15).forEach(client => {
    const projectCount = client.projects.length;
    const activeProjects = client.projects.filter(p => p.status === 'IN_PROGRESS').length;
    const totalRevenue = client.invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.amount, 0);

    let value = `Projects: ${projectCount} (${activeProjects} active)`;
    if (totalRevenue > 0) {
      value += ` | Revenue: $${totalRevenue.toFixed(2)}`;
    }
    if (client.company) {
      value += ` | ${client.company}`;
    }

    embed.addFields({
      name: client.name,
      value,
      inline: false,
    });
  });

  if (clients.length > 15) {
    embed.setFooter({ text: `Showing 15 of ${clients.length} clients` });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleView(interaction: ChatInputCommandInteraction, user: User) {
  const nameSearch = interaction.options.getString('name', true);

  const client = await prisma.client.findFirst({
    where: {
      userId: user.id,
      name: { contains: nameSearch },
    },
    include: {
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!client) {
    await interaction.reply({
      content: `❌ No client found matching "${nameSearch}"`,
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`👤 ${client.name}`)
    .setTimestamp();

  if (client.email) embed.addFields({ name: 'Email', value: client.email, inline: true });
  if (client.company) embed.addFields({ name: 'Company', value: client.company, inline: true });

  const totalRevenue = client.invoices
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);

  embed.addFields(
    { name: 'Projects', value: String(client.projects.length), inline: true },
    { name: 'Invoices', value: String(client.invoices.length), inline: true },
    { name: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, inline: true }
  );

  if (client.projects.length > 0) {
    const projectsList = client.projects
      .slice(0, 3)
      .map(p => `• ${p.title} (${p.status.replace('_', ' ')})`)
      .join('\n');
    embed.addFields({ name: 'Recent Projects', value: projectsList });
  }

  await interaction.reply({ embeds: [embed] });
}
