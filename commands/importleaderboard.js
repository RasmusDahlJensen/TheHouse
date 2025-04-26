// const { SlashCommandBuilder } = require('discord.js');
// const fs = require('fs');
// const path = require('path');

// module.exports = {
//     data: new SlashCommandBuilder()
//         .setName('importleaderboard')
//         .setDescription('⚠️ IMPORT your local backup leaderboard into Railway volume'),

//     async execute(interaction) {
//         const userId = interaction.user.id;
//         const allowedUsers = ['161913212260974592'];

//         if (!allowedUsers.includes(userId)) {
//             return interaction.reply({ content: '❌ You are not allowed to run this.', ephemeral: true });
//         }

//         try {
//             const backupData = {
//                 "161913212260974592": { "name": "hispeed", "net": -11000 },
//                 "204309603532406797": { "name": "baluba", "net": 11000 }
//             };

//             const filePath = path.join('/mnt/data', 'leaderboard.json');

//             fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

//             await interaction.reply('✅ Successfully imported backup leaderboard into Railway volume!');
//         } catch (error) {
//             console.error('Failed to import leaderboard:', error);
//             await interaction.reply('❌ Failed to import leaderboard. Check logs.');
//         }
//     }
// };
