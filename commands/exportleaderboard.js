const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exportleaderboard')
        .setDescription('📤 Export and download the permanent leaderboard as a JSON file'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const allowedUsers = ['161913212260974592'];

        if (!allowedUsers.includes(userId)) {
            return interaction.reply({ content: '❌ You are not allowed to run this.', ephemeral: true });
        }

        try {
            const filePath = path.join('/mnt/data', 'leaderboard.json');

            if (!fs.existsSync(filePath)) {
                return interaction.reply({ content: '❌ No leaderboard file found.', ephemeral: true });
            }

            const file = new AttachmentBuilder(filePath, { name: 'leaderboard.json' });

            await interaction.reply({
                content: 'Here is the current permanent leaderboard:',
                files: [file]
            });
        } catch (error) {
            console.error('Failed to export leaderboard:', error);
            await interaction.reply({ content: '❌ Failed to export leaderboard. Check logs.', ephemeral: true });
        }
    }
};
