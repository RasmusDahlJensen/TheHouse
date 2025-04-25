const { SlashCommandBuilder } = require('discord.js');
const { getContext } = require('../utils/context');
const tableManager = require('../models/TableManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leavetable')
        .setDescription('Leave your current table'),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const { user, displayName } = getContext(interaction);
        const table = tableManager.getTableByUser(user.id);

        if (!table) {
            return interaction.reply({ content: 'You are not currently in a table.', ephemeral: true });
        }

        const wasHost = table.hostUserId === user.id;

        table.removePlayer(user.id);
        tableManager.unregisterUser(user.id);

        if (table.isEmpty()) {
            tableManager.deleteTable(table.name);
            return interaction.reply(`👋 **${displayName}** left **${table.name}**. The table has been closed.`);
        }

        if (wasHost) {
            table.hostUserId = table.players[0].user.id;
            await interaction.reply(`👋 **${displayName}** left **${table.name}**. Host passed to **${table.players[0].user.username}**.`);
        } else {
            await interaction.reply(`👋 **${displayName}** left **${table.name}**.`);
        }
    }
};
