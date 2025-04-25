const { SlashCommandBuilder } = require('discord.js');
const tableManager = require('../models/TableManager');
const { getContext } = require('../utils/context');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwager')
        .setDescription('Set or change the table wager (host only)')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount each player will wager')
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const { user, displayName } = getContext(interaction);
        const table = tableManager.getTableByUser(user.id);

        if (!table) {
            return interaction.reply({ content: 'You are not in a table.', flags: 64 });
        }

        if (table.hostUserId !== user.id) {
            return interaction.reply({ content: 'Only the host can change the wager.', flags: 64 });
        }

        const amount = interaction.options.getInteger('amount');
        table.wager = amount;

        await interaction.reply(`💰 **${displayName}** set the wager to **${amount}** per player in **${table.name}**.`);
    }
};
