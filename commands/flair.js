const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flair')
        .setDescription('Toggle your Casino Flair to gain access to the Casino Lobby'),
    async execute(interaction) {
        if (!interaction.guild) {
             return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
        }

        const configPath = path.join(__dirname, '../config/flair.json');
        
        if (!fs.existsSync(configPath)) {
            return interaction.reply({ content: '❌ The Casino Flair system is not currently set up by the server admin.', ephemeral: true });
        }

        let config;
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            console.error(e);
            return interaction.reply({ content: '❌ Failed to read flair configuration.', ephemeral: true });
        }

        if (!config.roleId) {
             return interaction.reply({ content: '❌ The Casino Flair role is not configured properly.', ephemeral: true });
        }

        const role = interaction.guild.roles.cache.get(config.roleId);
        
        if (!role) {
             return interaction.reply({ content: '❌ The flair role doesn\'t seem to exist on this server anymore.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const hasRole = interaction.member.roles.cache.has(role.id);

        try {
            if (hasRole) {
                await interaction.member.roles.remove(role);
                await interaction.editReply({ content: '📤 Casino Flair removed. You will no longer see the Casino Lobby.' });
            } else {
                await interaction.member.roles.add(role);
                await interaction.editReply({ content: '📥 Casino Flair added! You should now have access to the Casino Lobby.' });
            }
        } catch(error) {
            console.error('Error modifying flair role:', error);
            await interaction.editReply({ content: '❌ Error applying the role. Please check my role hierarchy permissions.' });
        }
    }
};
