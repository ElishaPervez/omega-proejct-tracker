import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { User, ProjectStatus, ProjectPriority } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { formatShortDate } from '../../lib/utils';

export const sideProjectCommand = {
  data: new SlashCommandBuilder()
    .setName('sideproject')
    .setDescription('Manage your side projects')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new side project')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Side project title')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Side project description')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('priority')
            .setDescription('Project priority')
            .setRequired(false)
            .addChoices(
              { name: 'Low', value: 'LOW' },
              { name: 'Medium', value: 'MEDIUM' },
              { name: 'High', value: 'HIGH' },
              { name: 'Urgent', value: 'URGENT' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all your side projects')
        .addStringOption(option =>
          option
            .setName('status')
            .setDescription('Filter by status')
            .setRequired(false)
            .addChoices(
              { name: 'Not Started', value: 'NOT_STARTED' },
              { name: 'In Progress', value: 'IN_PROGRESS' },
              { name: 'On Hold', value: 'ON_HOLD' },
              { name: 'Completed', value: 'COMPLETED' },
              { name: 'Cancelled', value: 'CANCELLED' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription('Update a side project status')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Side project title (partial match)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('status')
            .setDescription('New status')
            .setRequired(true)
            .addChoices(
              { name: 'Not Started', value: 'NOT_STARTED' },
              { name: 'In Progress', value: 'IN_PROGRESS' },
              { name: 'On Hold', value: 'ON_HOLD' },
              { name: 'Completed', value: 'COMPLETED' },
              { name: 'Cancelled', value: 'CANCELLED' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('hours')
        .setDescription('Add hours worked to a side project')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Side project title (partial match)')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option
            .setName('hours')
            .setDescription('Hours worked')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, user: User) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'create':
        await handleCreate(interaction, user);
        break;
      case 'list':
        await handleList(interaction, user);
        break;
      case 'update':
        await handleUpdate(interaction, user);
        break;
      case 'hours':
        await handleAddHours(interaction, user);
        break;
    }
  },
};

async function handleCreate(interaction: ChatInputCommandInteraction, user: User) {
  const title = interaction.options.getString('title', true);
  const description = interaction.options.getString('description');
  const priority = (interaction.options.getString('priority') as ProjectPriority) || 'LOW';

  const sideProject = await prisma.sideProject.create({
    data: {
      title,
      description,
      priority,
      userId: user.id,
    },
  });

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('✅ Side Project Created')
    .setDescription(`**${sideProject.title}**`)
    .addFields(
      { name: 'Priority', value: sideProject.priority, inline: true },
      { name: 'Status', value: sideProject.status.replace('_', ' '), inline: true }
    )
    .setTimestamp();

  if (description) {
    embed.addFields({ name: 'Description', value: description });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleList(interaction: ChatInputCommandInteraction, user: User) {
  const statusFilter = interaction.options.getString('status') as ProjectStatus | null;

  const sideProjects = await prisma.sideProject.findMany({
    where: {
      userId: user.id,
      ...(statusFilter && { status: statusFilter }),
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 25,
  });

  if (sideProjects.length === 0) {
    await interaction.reply({
      content: '📋 No side projects found. Create one with `/sideproject create`',
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xEB459E)
    .setTitle('💼 Your Side Projects')
    .setDescription(`Showing ${sideProjects.length} side project(s)`)
    .setTimestamp();

  const priorityEmoji = {
    LOW: '🟢',
    MEDIUM: '🟡',
    HIGH: '🟠',
    URGENT: '🔴',
  };

  const statusEmoji = {
    NOT_STARTED: '⚪',
    IN_PROGRESS: '🔵',
    ON_HOLD: '🟡',
    COMPLETED: '✅',
    CANCELLED: '❌',
  };

  sideProjects.slice(0, 10).forEach(project => {
    const priority = priorityEmoji[project.priority];
    const status = statusEmoji[project.status];
    const hours = project.hoursWorked > 0 ? ` | ${project.hoursWorked}h` : '';

    embed.addFields({
      name: `${priority} ${status} ${project.title}`,
      value: `${project.status.replace('_', ' ')}${hours}`,
      inline: false,
    });
  });

  if (sideProjects.length > 10) {
    embed.setFooter({ text: `Showing 10 of ${sideProjects.length} side projects` });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleUpdate(interaction: ChatInputCommandInteraction, user: User) {
  const titleSearch = interaction.options.getString('title', true);
  const newStatus = interaction.options.getString('status', true) as ProjectStatus;

  const sideProject = await prisma.sideProject.findFirst({
    where: {
      userId: user.id,
      title: { contains: titleSearch },
    },
  });

  if (!sideProject) {
    await interaction.reply({
      content: `❌ No side project found matching "${titleSearch}"`,
      ephemeral: true,
    });
    return;
  }

  const updated = await prisma.sideProject.update({
    where: { id: sideProject.id },
    data: {
      status: newStatus,
      ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
    },
  });

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('✅ Side Project Updated')
    .setDescription(`**${updated.title}**`)
    .addFields(
      { name: 'Old Status', value: sideProject.status.replace('_', ' '), inline: true },
      { name: 'New Status', value: newStatus.replace('_', ' '), inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleAddHours(interaction: ChatInputCommandInteraction, user: User) {
  const titleSearch = interaction.options.getString('title', true);
  const hours = interaction.options.getNumber('hours', true);

  const sideProject = await prisma.sideProject.findFirst({
    where: {
      userId: user.id,
      title: { contains: titleSearch },
    },
  });

  if (!sideProject) {
    await interaction.reply({
      content: `❌ No side project found matching "${titleSearch}"`,
      ephemeral: true,
    });
    return;
  }

  const updated = await prisma.sideProject.update({
    where: { id: sideProject.id },
    data: {
      hoursWorked: sideProject.hoursWorked + hours,
    },
  });

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('⏱️ Hours Added')
    .setDescription(`**${updated.title}**`)
    .addFields(
      { name: 'Hours Added', value: `${hours}h`, inline: true },
      { name: 'Total Hours', value: `${updated.hoursWorked}h`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
