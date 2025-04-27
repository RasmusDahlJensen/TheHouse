const { SlashCommandBuilder } = require('discord.js');
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
            return interaction.reply({ content: 'You are already in a table. Leave it before starting a new one.', ephemeral: true });
        }

        const wager = interaction.options.getInteger('wager');

        // Create and register the new table
        const table = tableManager.createTable(wager, user);

        await interaction.reply(`🎲 Table **${table.name}** created with a **${wager}** wager.\n**${displayName}** is the host.\nOthers can now join with \`/jointable ${table.name}\``);
    }
};
