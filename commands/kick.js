const { SlashCommandBuilder } = require('discord.js');
const tableManager = require('../models/TableManager');
const { getContext } = require('../utils/context');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick someone from your current table (host only)')
        .addStringOption(option =>
            option
                .setName('player')
                .setDescription('Display name or bot name to kick')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async execute(interaction) {
        const { user, displayName } = getContext(interaction);
        const table = tableManager.getTableByUser(user.id);

        if (!table) {
            return interaction.reply({ content: 'You are not in a table.', flags: 64 });
        }

        if (table.hostUserId !== user.id) {
            return interaction.reply({ content: 'Only the table host can kick players.', flags: 64 });
        }

        const idToKick = interaction.options.getString('player');
        const target = table.players.find(p => p.user.id === idToKick);

        if (!target) {
            return interaction.reply({ content: `❌ No player with that ID was found in your table.`, flags: 64 });
        }

        const wasHost = target.user.id === table.hostUserId;

        table.removePlayer(target.user.id);
        tableManager.unregisterUser(target.user.id);

        // ✅ Prevent bot from becoming host
        if (wasHost) {
            const nextRealPlayer = table.players.find(p => !p.isBot);
            if (nextRealPlayer) {
                table.hostUserId = nextRealPlayer.user.id;
            } else {
                tableManager.deleteTable(table.name);
                return interaction.reply(`👋 **${displayName}** left and no real players remain. Table closed.`);
            }
        }

        await interaction.reply(`🦶 **${target.user.username}** was kicked from **${table.name}** by **${displayName}**.`);

        if (table.isEmpty()) {
            tableManager.deleteTable(table.name);
        }
    },

    async autocomplete(interaction) {
        const { user } = getContext(interaction);
        const table = tableManager.getTableByUser(user.id);
        if (!table) return interaction.respond([]);

        const choices = table.players.map(p => ({
            name: `${p.user.username}${p.isBot ? ' [BOT]' : ''}`,
            value: p.user.id
        }));

        await interaction.respond(choices.slice(0, 25));
    }
};
