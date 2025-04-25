const { SlashCommandBuilder } = require('discord.js');
const { getSessionLeaderboard } = require('../data/sessionLeaderboard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sessionleaderboard')
        .setDescription('View current session net earnings for all players'),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const leaderboard = getSessionLeaderboard();

        if (leaderboard.length === 0) {
            return interaction.reply({ content: '📭 No session data yet. Roll to build your streak!', flags: 64 });
        }

        const summary = leaderboard
            .map(p => {
                const prefix = p.net > 0 ? '+' : '';
                return `${prefix}${p.net.toLocaleString()} – ${p.name}`;
            })
            .join('\n');

        await interaction.reply({
            content: `💼 **Session Leaderboard** (Net Winnings):\n${summary}`
        });
    }
};
