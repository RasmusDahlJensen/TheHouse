const { SlashCommandBuilder } = require('discord.js');
const tableManager = require('../models/TableManager');
const { getContext } = require('../utils/context');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kickbots')
        .setDescription('Kick all bots from your current table (host only)'),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const { user, displayName } = getContext(interaction);
        const table = tableManager.getTableByUser(user.id);

        if (!table) {
            return interaction.reply({ content: 'You are not in a table.', flags: 64 });
        }

        if (table.hostUserId !== user.id) {
            return interaction.reply({ content: 'Only the host can kick bots.', flags: 64 });
        }

        const botCountBefore = table.players.length;
        table.players = table.players.filter(p => !p.isBot);
        const botCountAfter = table.players.length;
        const kicked = botCountBefore - botCountAfter;

        if (kicked === 0) {
            return interaction.reply({ content: 'There are no bots in your table.', flags: 64 });
        }

        return interaction.reply(`🧹 **${displayName}** kicked ${kicked} bot(s) from **${table.name}**.`);
    }
};
