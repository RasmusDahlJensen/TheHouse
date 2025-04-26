const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getContext } = require('../utils/context');
const tableManager = require('../models/TableManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('starttable')
        .setDescription('Start a new table with a wager amount')
        .addIntegerOption(option =>
            option.setName('wager')
                .setDescription('Wager amount (e.g., 5000)')
                .setRequired(true)
                .setMinValue(1)
        ),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const { user, displayName } = getContext(interaction);

        // Prevent user from starting if they're already in a table
        if (tableManager.getTableByUser(user.id)) {
            return interaction.reply({ content: '❌ You are already in a table. Leave it before starting a new one.', ephemeral: true });
        }

        const wager = interaction.options.getInteger('wager');
        // Create and register the new table
        const table = tableManager.createTable(wager, user);

        // Build the initial embed
        const embed = new EmbedBuilder()
            .setTitle(`🎲 ${table.name}`)
            .setDescription(`Wager: **${wager.toLocaleString()} gold**\n\nNo players yet.`)
            .setColor(0x00AE86)
            .setFooter({ text: `Host: ${displayName}` });

        // Build the buttons
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`join-${table.name}`)
                .setLabel('🎟️ Join Table')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`leave-${table.name}`)
                .setLabel('🏃 Leave Table')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`ready-${table.name}`)
                .setLabel('✅ Ready Up')
                .setStyle(ButtonStyle.Primary)
        );

        // Send the embed + buttons
        const msg = await interaction.reply({
            embeds: [embed],
            components: [buttons],
            fetchReply: true
        });

        // Save the message and channel info for later updating
        table.messageId = msg.id;
        table.channelId = msg.channel.id;
    }
};
