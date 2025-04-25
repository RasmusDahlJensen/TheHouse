const { SlashCommandBuilder } = require('discord.js');
const tableManager = require('../models/TableManager');
const { getContext } = require('../utils/context');
const { updateSession, getSessionLeaderboard } = require('../data/sessionLeaderboard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Start rolling for your table (host only)'),

    async execute(interaction) {
        const { user, displayName } = getContext(interaction);
        const table = tableManager.getTableByUser(user.id);
        const pot = table.players.length * table.wager;
        const winnings = pot - table.wager;

        if (!table) {
            return interaction.reply({ content: 'You are not in a table.', flags: 64 });
        }

        if (table.hostUserId !== user.id) {
            return interaction.reply({ content: 'Only the host can start the roll.', flags: 64 });
        }

        if (table.players.length < 2) {
            return interaction.reply({ content: 'You need at least 2 players to start a roll.', flags: 64 });
        }

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Reset state
        table.players.forEach(p => {
            p.roll = null;
            p.position = null;
            p.previousPosition = null;
        });

        // Utility to get sorted players
        const getSortedPlayers = () => {
            return table.players.slice().sort((a, b) => {
                if (a.roll === null && b.roll === null) return 0;
                if (a.roll === null) return 1;
                if (b.roll === null) return -1;
                return b.roll - a.roll;
            });
        };

        // Utility to render current state
        const renderList = () => {
            const sorted = getSortedPlayers();

            return sorted.map((p, i) => {
                const movement = p.roll === null
                    ? '🔸'
                    : p.previousPosition < p.position
                        ? '📉'
                        : '➔';

                const status = p.roll === null ? '⌛' : `🎲 ${p.roll}`;
                return `**${i + 1}.** ${movement} ${p.user.username} ${status}`;
            }).join('\n');
        };

        const msg = await interaction.reply({
            content: `🎲 Rolling for **${table.name}**...\n\n${renderList()}`,
            fetchReply: true
        });

        await delay(500);

        for (let i = 0; i < table.players.length; i++) {
            getSortedPlayers().forEach((p, index) => {
                p.previousPosition = p.position;
            });

            table.players[i].roll = Math.ceil(Math.random() * 100);

            getSortedPlayers().forEach((p, index) => {
                p.position = index;
            });

            await msg.edit({
                content: `🎲 Rolling for **${table.name}**...\n\n${renderList()}`
            });

            await delay(1500);
        }

        const finalWinner = getSortedPlayers()[0];
        // Update session net winnings/losses
        for (const player of table.players) {
            const net = player.user.id === finalWinner.user.id
                ? winnings
                : -table.wager;

            updateSession(player.user.id, player.user.username, net);
        }

        const sessionSummary = getSessionLeaderboard()
            .map(p => {
                const prefix = p.net > 0 ? '+' : '';
                return `${prefix}${p.net.toLocaleString()} – ${p.name}`;
            })
            .join('\n');

        await msg.edit({
            content:
                `🎲 Final Results for **${table.name}**\n\n${renderList()}\n\n🏆 🏆 **${finalWinner.user.username}** wins with a ${finalWinner.roll} and takes home 💰 ${winnings.toLocaleString()} gold!\n\n💼 **Session Leaderboard:**\n${sessionSummary}`
        });

    }
};
