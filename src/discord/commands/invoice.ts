import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { User, InvoiceStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { generateInvoiceNumber, formatCurrency, formatShortDate } from '../../lib/utils';

export const invoiceCommand = {
  data: new SlashCommandBuilder()
    .setName('invoice')
    .setDescription('Manage your invoices')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new invoice')
        .addNumberOption(option =>
          option
            .setName('amount')
            .setDescription('Invoice amount')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('client')
            .setDescription('Client name')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Invoice description')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('due_days')
            .setDescription('Days until due (default: 30)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all your invoices')
        .addStringOption(option =>
          option
            .setName('status')
            .setDescription('Filter by status')
            .setRequired(false)
            .addChoices(
              { name: 'Draft', value: 'DRAFT' },
              { name: 'Sent', value: 'SENT' },
              { name: 'Paid', value: 'PAID' },
              { name: 'Overdue', value: 'OVERDUE' },
              { name: 'Cancelled', value: 'CANCELLED' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription('Update invoice status')
        .addStringOption(option =>
          option
            .setName('invoice_number')
            .setDescription('Invoice number')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option
            .setName('status')
            .setDescription('New status')
            .setRequired(true)
            .addChoices(
              { name: 'Draft', value: 'DRAFT' },
              { name: 'Sent', value: 'SENT' },
              { name: 'Paid', value: 'PAID' },
              { name: 'Overdue', value: 'OVERDUE' },
              { name: 'Cancelled', value: 'CANCELLED' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View invoice details')
        .addStringOption(option =>
          option
            .setName('invoice_number')
            .setDescription('Invoice number')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove an invoice')
        .addStringOption(option =>
          option
            .setName('invoice_number')
            .setDescription('Invoice number')
            .setRequired(true)
            .setAutocomplete(true)
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
      case 'view':
        await handleView(interaction, user);
        break;
      case 'remove':
        await handleRemove(interaction, user);
        break;
    }
  },
};

async function handleCreate(interaction: ChatInputCommandInteraction, user: User) {
  const amount = interaction.options.getNumber('amount', true);
  const clientName = interaction.options.getString('client', true);
  const description = interaction.options.getString('description');
  const dueDays = interaction.options.getInteger('due_days') || 30;

  const client = await prisma.client.findFirst({
    where: {
      userId: user.id,
      name: { contains: clientName },
    },
  });

  if (!client) {
    await interaction.editReply({
      content: `❌ No client found matching "${clientName}". Add them first with \`/client add\``,
      ephemeral: true,
    });
    return;
  }

  const invoiceNumber = generateInvoiceNumber();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      amount,
      description,
      dueDate,
      userId: user.id,
      clientId: client.id,
    },
    include: {
      client: true,
    },
  });

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('✅ Invoice Created')
    .setDescription(`**${invoice.invoiceNumber}**`)
    .addFields(
      { name: 'Amount', value: formatCurrency(invoice.amount), inline: true },
      { name: 'Client', value: invoice.client!.name, inline: true },
      { name: 'Status', value: invoice.status, inline: true },
      { name: 'Due Date', value: formatShortDate(invoice.dueDate), inline: true }
    )
    .setTimestamp();

  if (description) {
    embed.addFields({ name: 'Description', value: description });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleList(interaction: ChatInputCommandInteraction, user: User) {
  const statusFilter = interaction.options.getString('status') as InvoiceStatus | null;

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: user.id,
      ...(statusFilter && { status: statusFilter }),
    },
    include: {
      client: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (invoices.length === 0) {
    await interaction.editReply({
      content: '📋 No invoices found. Create one with `/invoice create`',
      ephemeral: true,
    });
    return;
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('💰 Your Invoices')
    .setDescription(
      `Total: ${formatCurrency(totalAmount)} | Paid: ${formatCurrency(paidAmount)}`
    )
    .setTimestamp();

  const statusEmoji = {
    DRAFT: '📝',
    SENT: '📤',
    PAID: '✅',
    OVERDUE: '⚠️',
    CANCELLED: '❌',
  };

  invoices.slice(0, 10).forEach(invoice => {
    const emoji = statusEmoji[invoice.status];
    const client = invoice.client ? ` | ${invoice.client.name}` : '';

    embed.addFields({
      name: `${emoji} ${invoice.invoiceNumber}`,
      value: `${formatCurrency(invoice.amount)}${client} | Due: ${formatShortDate(invoice.dueDate)}`,
      inline: false,
    });
  });

  if (invoices.length > 10) {
    embed.setFooter({ text: `Showing 10 of ${invoices.length} invoices` });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleUpdate(interaction: ChatInputCommandInteraction, user: User) {
  const invoiceNumber = interaction.options.getString('invoice_number', true);
  const newStatus = interaction.options.getString('status', true) as InvoiceStatus;

  const invoice = await prisma.invoice.findFirst({
    where: {
      userId: user.id,
      invoiceNumber,
    },
  });

  if (!invoice) {
    await interaction.editReply({
      content: `❌ No invoice found with number "${invoiceNumber}"`,
      ephemeral: true,
    });
    return;
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: newStatus,
      ...(newStatus === 'PAID' && { paidDate: new Date() }),
    },
  });

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('✅ Invoice Updated')
    .setDescription(`**${updatedInvoice.invoiceNumber}**`)
    .addFields(
      { name: 'Amount', value: formatCurrency(updatedInvoice.amount), inline: true },
      { name: 'Old Status', value: invoice.status, inline: true },
      { name: 'New Status', value: newStatus, inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleView(interaction: ChatInputCommandInteraction, user: User) {
  const invoiceNumber = interaction.options.getString('invoice_number', true);

  const invoice = await prisma.invoice.findFirst({
    where: {
      userId: user.id,
      invoiceNumber,
    },
    include: {
      client: true,
      project: true,
    },
  });

  if (!invoice) {
    await interaction.editReply({
      content: `❌ No invoice found with number "${invoiceNumber}"`,
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`💰 ${invoice.invoiceNumber}`)
    .addFields(
      { name: 'Amount', value: formatCurrency(invoice.amount), inline: true },
      { name: 'Status', value: invoice.status, inline: true },
      { name: 'Currency', value: invoice.currency, inline: true }
    );

  if (invoice.description) {
    embed.setDescription(invoice.description);
  }

  if (invoice.client) {
    embed.addFields({ name: 'Client', value: invoice.client.name, inline: true });
  }

  if (invoice.project) {
    embed.addFields({ name: 'Project', value: invoice.project.title, inline: true });
  }

  embed.addFields(
    { name: 'Issued', value: formatShortDate(invoice.issuedDate), inline: true },
    { name: 'Due Date', value: formatShortDate(invoice.dueDate), inline: true }
  );

  if (invoice.paidDate) {
    embed.addFields({ name: 'Paid Date', value: formatShortDate(invoice.paidDate), inline: true });
  }

  embed.setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleRemove(interaction: ChatInputCommandInteraction, user: User) {
  const invoiceNumber = interaction.options.getString('invoice_number', true);

  const invoice = await prisma.invoice.findFirst({
    where: {
      userId: user.id,
      invoiceNumber,
    },
    include: {
      client: true,
    },
  });

  if (!invoice) {
    await interaction.editReply({
      content: `❌ No invoice found with number "${invoiceNumber}"`,
    });
    return;
  }

  await prisma.invoice.delete({
    where: { id: invoice.id },
  });

  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle('🗑️ Invoice Removed')
    .setDescription(`**${invoice.invoiceNumber}** has been deleted`)
    .addFields(
      { name: 'Amount', value: formatCurrency(invoice.amount), inline: true },
      { name: 'Client', value: invoice.client?.name || 'None', inline: true },
      { name: 'Status', value: invoice.status, inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
