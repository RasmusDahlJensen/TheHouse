const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const lobbyManager = require('../models/lobbyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startlobby')
        .setDescription('Create the casino lobby channel.'),

    async execute(interaction) {
        const guild = interaction.guild;
        const everyoneRole = guild.roles.everyone;
        const roleName = 'Gambler';

        // Find or create the flair role
        let flairRole = guild.roles.cache.find(r => r.name === roleName);
        if (!flairRole) {
            flairRole = await guild.roles.create({
                name: roleName,
                color: 'Gold',
                reason: 'Grants access to the casino lobby',
            });
        }

        // Check if lobby channel already exists
        let lobbyChannel = guild.channels.cache.find(
            c => c.name === 'lobby' && c.type === ChannelType.GuildText
        );

        // Create it if not present
        if (!lobbyChannel) {
            lobbyChannel = await guild.channels.create({
                name: 'lobby',
                type: ChannelType.GuildText,
                reason: 'Casino lobby creation',
                permissionOverwrites: [
                    {
                        id: everyoneRole.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: flairRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                    }
                ]
            });
        }

        await lobbyManager.setLobbyChannel(lobbyChannel);
        await lobbyManager.refreshLobby(interaction.client);

        await interaction.reply({
            content: `✅ Lobby channel is ready: ${lobbyChannel}`,
            ephemeral: true
        });
    }
};
