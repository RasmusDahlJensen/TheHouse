const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const lobbyManager = require('../models/lobbyManager'); // Ensure path is correct

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startlobby')
        .setDescription('Create the casino lobby channel.'),

    async execute(interaction) {
        console.log('[STARTLOBBY_DEBUG] Executing /startlobby command...');
        const guild = interaction.guild;
        const everyoneRole = guild.roles.everyone;
        const roleName = 'Gambler';

        let flairRole = guild.roles.cache.find(r => r.name === roleName);
        if (!flairRole) {
            // ... (role creation logic) ...
            flairRole = await guild.roles.create({ /* ... */ });
        }

        let lobbyChannel = guild.channels.cache.find(
            c => c.name === 'lobby' && c.type === ChannelType.GuildText
        );

        if (!lobbyChannel) {
            console.log('[STARTLOBBY_DEBUG] Lobby channel not found in cache, creating new one...');
            lobbyChannel = await guild.channels.create({
                name: 'lobby',
                type: ChannelType.GuildText,
                // ... (permissions) ...
            });
            console.log(`[STARTLOBBY_DEBUG] Created new lobby channel: ${lobbyChannel.id} (${lobbyChannel.name})`);
        } else {
            console.log(`[STARTLOBBY_DEBUG] Found existing lobby channel: ${lobbyChannel.id} (${lobbyChannel.name})`);
        }

        if (!lobbyChannel) {
            console.error('[STARTLOBBY_DEBUG] CRITICAL: lobbyChannel is null/undefined even after creation/finding attempt!');
            return interaction.reply({ content: '❌ Failed to create or find the lobby channel.', ephemeral: true });
        }

        console.log(`[STARTLOBBY_DEBUG] Calling lobbyManager.setLobbyChannel with channel ID: ${lobbyChannel.id}`);
        await lobbyManager.setLobbyChannel(lobbyChannel); // setLobbyChannel is async in your LobbyManager
        console.log('[STARTLOBBY_DEBUG] Returned from lobbyManager.setLobbyChannel.');

        // Check if it was set in the manager instance
        if (lobbyManager.lobbyChannel) {
            console.log(`[STARTLOBBY_DEBUG] lobbyManager.lobbyChannel is now set to: ${lobbyManager.lobbyChannel.id}`);
        } else {
            console.error('[STARTLOBBY_DEBUG] CRITICAL: lobbyManager.lobbyChannel is STILL NULL after calling setLobbyChannel!');
        }


        console.log('[STARTLOBBY_DEBUG] Calling lobbyManager.refreshLobby...');
        await lobbyManager.refreshLobby(interaction.client);
        console.log('[STARTLOBBY_DEBUG] Returned from lobbyManager.refreshLobby.');

        await interaction.reply({
            content: `✅ Lobby channel is ready: ${lobbyChannel}`,
            ephemeral: true
        });
        console.log('[STARTLOBBY_DEBUG] /startlobby command finished.');
    }
};