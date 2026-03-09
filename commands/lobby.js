const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const lobbyManager = require('../utils/lobbyManager');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lobby')
        .setDescription('Setup the Casino Lobby in this channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Clears the channel and establishes the permanent Lobby menu.')
                .addRoleOption(option => 
                    option.setName('flair')
                        .setDescription('The role that users need to see the casino lobby')
                        .setRequired(false)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            let flairRole = interaction.options.getRole('flair');
            
            // If no role was provided, try to find an existing "Casino Player" role or create one
            if (!flairRole) {
                flairRole = interaction.guild.roles.cache.find(r => r.name === 'Casino Player');
                if (!flairRole) {
                    flairRole = await interaction.guild.roles.create({
                        name: 'Casino Player',
                        color: '#f1c40f',
                        reason: 'Auto-generated for Casino Lobby flair system'
                    });
                }
            }
            
            let permissionOverwrites = [
                {
                    id: interaction.guild.id, // @everyone role
                    allow: [],
                    deny: flairRole ? [PermissionFlagsBits.ViewChannel] : [PermissionFlagsBits.SendMessages], 
                    // If flair is on, @everyone cannot see it. If no flair, @everyone can see but not talk.
                },
                {
                    id: interaction.client.user.id, // The bot itself
                    allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                },
            ];

            if (flairRole) {
                permissionOverwrites.push({
                    id: flairRole.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages], // Role can see, but not talk
                });

                // Save this role to a simple config so /flair knows what to toggle
                const configPath = path.join(__dirname, '../config/flair.json');
                if (!fs.existsSync(path.dirname(configPath))) fs.mkdirSync(path.dirname(configPath));
                fs.writeFileSync(configPath, JSON.stringify({ roleId: flairRole.id }));
            }

            // Create a new text channel
            const lobbyChannel = await interaction.guild.channels.create({
                name: 'casino-lobby',
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites,
                reason: 'Casino Lobby requested by Admin'
            });

            // Set the channel and send the initial lobby dashboard
            lobbyManager.setLobbyChannel(lobbyChannel.id);
            await lobbyManager.updateLobby(interaction.client);
            
            await interaction.editReply({ content: `✅ Dedicated Lobby channel created at <#${lobbyChannel.id}>!` });
        } catch (error) {
            console.error('Failed to create lobby channel:', error);
            await interaction.editReply({ content: '❌ Failed to create the #casino-lobby channel. Please check my manage channel permissions.' });
        }
    }
};
