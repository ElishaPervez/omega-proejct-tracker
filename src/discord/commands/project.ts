import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { User, ProjectStatus, ProjectPriority } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { formatShortDate } from '../../lib/utils';

export const projectCommand = {
  data: new SlashCommandBuilder()
    .setName('project')
    .setDescription('Manage your projects')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new project')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Project title')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Project description')
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
        .addStringOption(option =>
          option
            .setName('client')
            .setDescription('Client name')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all your projects')
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
        .setDescription('Update a project status')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Project title (partial match)')
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
        .setDescription('Add hours worked to a project')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Project title (partial match)')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option
            .setName('hours')
            .setDescription('Hours worked')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View project details')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Project title (partial match)')
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
      case 'view':
        await handleView(interaction, user);
        break;
    }
  },
};

async function handleCreate(interaction: ChatInputCommandInteraction, user: User) {
  const title = interaction.options.getString('title', true);
  const description = interaction.options.getString('description');
  const priority = (interaction.options.getString('priority') as ProjectPriority) || 'MEDIUM';
  const clientName = interaction.options.getString('client');

  let client = null;
  if (clientName) {
    client = await prisma.client.findFirst({
      where: {
        userId: user.id,
        name: { contains: clientName },
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: clientName,
          userId: user.id,
        },
      });
    }
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      priority,
      userId: user.id,
      clientId: client?.id,
    },
    include: {
      client: true,
    },
  });

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('✅ Project Created')
    .setDescription(`**${project.title}**`)
    .addFields(
      { name: 'Priority', value: project.priority, inline: true },
      { name: 'Status', value: project.status.replace('_', ' '), inline: true },
      { name: 'Client', value: project.client?.name || 'None', inline: true }
    )
    .setTimestamp();

  if (description) {
    embed.addFields({ name: 'Description', value: description });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleList(interaction: ChatInputCommandInteraction, user: User) {
  const statusFilter = interaction.options.getString('status') as ProjectStatus | null;

  const projects = await prisma.project.findMany({
    where: {
      userId: user.id,
      ...(statusFilter && { status: statusFilter }),
    },
    include: {
      client: true,
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 25,
  });

  if (projects.length === 0) {
    await interaction.reply({
      content: '📋 No projects found. Create one with `/project create`',
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📊 Your Projects')
    .setDescription(`Showing ${projects.length} project(s)`)
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

  projects.slice(0, 10).forEach(project => {
    const priority = priorityEmoji[project.priority];
    const status = statusEmoji[project.status];
    const client = project.client ? ` | Client: ${project.client.name}` : '';
    const hours = project.hoursWorked > 0 ? ` | ${project.hoursWorked}h` : '';

    embed.addFields({
      name: `${priority} ${status} ${project.title}`,
      value: `${project.status.replace('_', ' ')}${client}${hours}`,
      inline: false,
    });
  });

  if (projects.length > 10) {
    embed.setFooter({ text: `Showing 10 of ${projects.length} projects` });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleUpdate(interaction: ChatInputCommandInteraction, user: User) {
  const titleSearch = interaction.options.getString('title', true);
  const newStatus = interaction.options.getString('status', true) as ProjectStatus;

  const project = await prisma.project.findFirst({
    where: {
      userId: user.id,
      title: { contains: titleSearch },
    },
  });

  if (!project) {
    await interaction.reply({
      content: `❌ No project found matching "${titleSearch}"`,
      ephemeral: true,
    });
    return;
  }

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data: {
      status: newStatus,
      ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
    },
  });

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('✅ Project Updated')
    .setDescription(`**${updatedProject.title}**`)
    .addFields(
      { name: 'Old Status', value: project.status.replace('_', ' '), inline: true },
      { name: 'New Status', value: newStatus.replace('_', ' '), inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleAddHours(interaction: ChatInputCommandInteraction, user: User) {
  const titleSearch = interaction.options.getString('title', true);
  const hours = interaction.options.getNumber('hours', true);

  const project = await prisma.project.findFirst({
    where: {
      userId: user.id,
      title: { contains: titleSearch },
    },
  });

  if (!project) {
    await interaction.reply({
      content: `❌ No project found matching "${titleSearch}"`,
      ephemeral: true,
    });
    return;
  }

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data: {
      hoursWorked: project.hoursWorked + hours,
    },
  });

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('⏱️ Hours Added')
    .setDescription(`**${updatedProject.title}**`)
    .addFields(
      { name: 'Hours Added', value: `${hours}h`, inline: true },
      { name: 'Total Hours', value: `${updatedProject.hoursWorked}h`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleView(interaction: ChatInputCommandInteraction, user: User) {
  const titleSearch = interaction.options.getString('title', true);

  const project = await prisma.project.findFirst({
    where: {
      userId: user.id,
      title: { contains: titleSearch },
    },
    include: {
      client: true,
    },
  });

  if (!project) {
    await interaction.reply({
      content: `❌ No project found matching "${titleSearch}"`,
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📋 ${project.title}`)
    .addFields(
      { name: 'Status', value: project.status.replace('_', ' '), inline: true },
      { name: 'Priority', value: project.priority, inline: true },
      { name: 'Hours Worked', value: `${project.hoursWorked}h`, inline: true }
    );

  if (project.description) {
    embed.setDescription(project.description);
  }

  if (project.client) {
    embed.addFields({ name: 'Client', value: project.client.name, inline: true });
  }

  if (project.dueDate) {
    embed.addFields({ name: 'Due Date', value: formatShortDate(project.dueDate), inline: true });
  }

  if (project.completedAt) {
    embed.addFields({ name: 'Completed', value: formatShortDate(project.completedAt), inline: true });
  }

  embed.setFooter({ text: `Created ${formatShortDate(project.createdAt)}` });
  embed.setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
