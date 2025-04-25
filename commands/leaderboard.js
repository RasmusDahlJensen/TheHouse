const { SlashCommandBuilder } = require('discord.js');
const { getPermanentLeaderboard } = require('../data/leaderboard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the all-time permanent leaderboard'),

    async execute(interaction) {
        const leaderboard = getPermanentLeaderboard();

        if (leaderboard.length === 0) {
            return interaction.reply({ content: '📭 No leaderboard data yet.', flags: 64 });
        }

        const summary = leaderboard
            .map(p => {
                const prefix = p.net > 0 ? '+' : '';
                return `${prefix}${p.net.toLocaleString()} – ${p.name}`;
            })
            .join('\n');

        await interaction.reply({
            content: `🏆 **Leaderboard**:\n${summary}`
        });
    }
};
