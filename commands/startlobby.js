const { SlashCommandBuilder, ChannelType } = require('discord.js');
const lobbyManager = require('../models/lobbyManager');
const { data, execute } = require('./starttable');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startlobby')
        .setDescription('Create the casino lobby channel.'),

    async execute(interaction) {
        const guild = interaction.guild
        let lobbyChannel = guild.channels.cache.find(c => c.name === 'lobby' && c.type === ChannelType.GuildText);

        if (!lobbyChannel) {
            lobbyChannel = await guild.channels.create({
                name: 'lobby',
                type: ChannelType.GuildText,
                reason: 'Casino lobby creation'
            });
        }

        await lobbyManager.setLobbyChannel(lobbyChannel)
        await lobbyManager.refreshLobby(interaction.client);

        await interaction.reply({
            content: `✅ Lobby channel is ready: ${lobbyChannel}`, ephemeral: true
        })
    }
}