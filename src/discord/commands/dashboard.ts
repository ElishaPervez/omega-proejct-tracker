import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { formatCurrency } from '../../lib/utils';

export const dashboardCommand = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('View your project dashboard and statistics'),

  async execute(interaction: ChatInputCommandInteraction, user: User) {
    await interaction.deferReply();

    // Fetch all relevant data
    const [projects, sideProjects, clients, invoices] = await Promise.all([
      prisma.project.findMany({
        where: { userId: user.id },
        include: { client: true },
      }),
      prisma.sideProject.findMany({
        where: { userId: user.id },
      }),
      prisma.client.findMany({
        where: { userId: user.id },
      }),
      prisma.invoice.findMany({
        where: { userId: user.id },
      }),
    ]);

    // Calculate statistics
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
      completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
      totalSideProjects: sideProjects.length,
      activeSideProjects: sideProjects.filter(p => p.status === 'IN_PROGRESS').length,
      totalClients: clients.length,
      totalHoursWorked: projects.reduce((sum, p) => sum + p.hoursWorked, 0) +
        sideProjects.reduce((sum, p) => sum + p.hoursWorked, 0),
      totalRevenue: invoices
        .filter(i => i.status === 'PAID')
        .reduce((sum, i) => sum + i.amount, 0),
      pendingRevenue: invoices
        .filter(i => i.status === 'SENT' || i.status === 'OVERDUE')
        .reduce((sum, i) => sum + i.amount, 0),
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'PAID').length,
    };

    // Get next up projects
    const nextUp = projects
      .filter(p => p.status === 'NOT_STARTED' || p.status === 'IN_PROGRESS')
      .sort((a, b) => {
        // Sort by priority first, then by due date
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        return 0;
      })
      .slice(0, 3);

    // Build dashboard embed
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📊 Your Dashboard')
      .setDescription(`Hey ${user.name || user.discordUsername}! Here's your project overview:`)
      .addFields(
        {
          name: '📁 Projects',
          value: `Total: ${stats.totalProjects}\n` +
            `✅ Completed: ${stats.completedProjects}\n` +
            `🔵 In Progress: ${stats.activeProjects}`,
          inline: true,
        },
        {
          name: '💼 Side Projects',
          value: `Total: ${stats.totalSideProjects}\n` +
            `🔵 Active: ${stats.activeSideProjects}`,
          inline: true,
        },
        {
          name: '👥 Clients',
          value: `Total: ${stats.totalClients}`,
          inline: true,
        },
        {
          name: '💰 Revenue',
          value: `Earned: ${formatCurrency(stats.totalRevenue)}\n` +
            `Pending: ${formatCurrency(stats.pendingRevenue)}`,
          inline: true,
        },
        {
          name: '📄 Invoices',
          value: `Total: ${stats.totalInvoices}\n` +
            `Paid: ${stats.paidInvoices}`,
          inline: true,
        },
        {
          name: '⏱️ Hours Worked',
          value: `${stats.totalHoursWorked.toFixed(1)}h`,
          inline: true,
        }
      )
      .setTimestamp();

    // Add next up section
    if (nextUp.length > 0) {
      const nextUpText = nextUp
        .map(p => {
          const priorityEmoji = {
            LOW: '🟢',
            MEDIUM: '🟡',
            HIGH: '🟠',
            URGENT: '🔴',
          };
          const emoji = priorityEmoji[p.priority];
          const status = p.status === 'IN_PROGRESS' ? '▶️' : '⏸️';
          return `${emoji} ${status} ${p.title}`;
        })
        .join('\n');

      embed.addFields({
        name: '🎯 Next Up',
        value: nextUpText,
        inline: false,
      });
    }

    // Add web link
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    embed.setFooter({ text: `View full dashboard at ${appUrl}` });

    await interaction.editReply({ embeds: [embed] });
  },
};
