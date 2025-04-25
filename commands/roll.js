const { SlashCommandBuilder } = require('discord.js');
const tableManager = require('../models/TableManager');
const { getContext } = require('../utils/context');
const { updateSession, getSessionLeaderboard } = require('../data/sessionLeaderboard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Mark yourself ready for rolling'),

    async execute(interaction) {
        const { user, displayName } = getContext(interaction);
        const table = tableManager.getTableByUser(user.id);

        if (!table) {
            return interaction.reply({ content: 'You are not in a table.', flags: 64 });
        }

        if (table.players.length < 2) {
            return interaction.reply({ content: 'You need at least 2 players to roll.', flags: 64 });
        }

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Initialize if missing
        if (!table.readyPlayers) {
            table.readyPlayers = new Set();
        }

        // Mark player as ready
        table.readyPlayers.add(user.id);

        const allReady = table.players.every(p => table.readyPlayers.has(p.user.id));

        const renderReadyList = () => {
            return table.players.map((p, i) => {
                const isReady = table.readyPlayers.has(p.user.id);
                return `**${i + 1}.** ${isReady ? '✅' : '🔸'} ${p.user.username}`;
            }).join('\n');
        };

        const pot = table.players.length * table.wager;
        const winnings = pot - table.wager;

        if (!allReady) {
            await interaction.reply({
                content: `🕓 Waiting for players to be ready at **${table.name}**:\n\n${renderReadyList()}`,
                fetchReply: false
            });
            return;
        }

        // Reset for rolling
        table.players.forEach(p => {
            p.roll = null;
            p.position = null;
            p.previousPosition = null;
        });

        const getSortedPlayers = () => {
            return table.players.slice().sort((a, b) => {
                if (a.roll === null && b.roll === null) return 0;
                if (a.roll === null) return 1;
                if (b.roll === null) return -1;
                return b.roll - a.roll;
            });
        };

        const renderRollList = () => {
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
            content: `🎲 Everyone is ready! Rolling for **${table.name}**...\n\n${renderRollList()}`,
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
                content: `🎲 Rolling for **${table.name}**...\n\n${renderRollList()}`
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
                `🎲 Final Results for **${table.name}**\n\n${renderRollList()}\n\n🏆 **${finalWinner.user.username}** wins with a ${finalWinner.roll} and takes home 💰 ${winnings.toLocaleString()} gold!\n\n💼 **Session Leaderboard:**\n${sessionSummary}`
        });

        // Clear ready status after round ends
        table.readyPlayers.clear();
    }
};
