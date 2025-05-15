const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const tableManager = require('./tableManager');

class LobbyManager {
    constructor() {
        this.lobbyChannel = null;
        this.welcomeMessageId = null;
        this.tableMessageMap = new Map();
    }

    async setLobbyChannel(channel) {
        this.lobbyChannel = channel;
    }

    async refreshLobby(client) {
        if (!this.lobbyChannel) return;

        // Clear all lobby messages first
        const messages = await this.lobbyChannel.messages.fetch();
        await Promise.all(messages.map(m => m.delete()));

        // Sort tables by newest first
        const tables = tableManager.getAllTables()
            .sort((a, b) => b.createdAt - a.createdAt);

        // Recreate messages
        for (const table of tables) {
            const embed = new EmbedBuilder()
                .setTitle(`🎲 ${table.name}`)
                .setDescription(`Wager: **${table.wager.toLocaleString()} gold**\n\n👥 **Players:**\n${table.players.map(p => p.user.username).join(', ') || '*No players yet*'}`)
                .setColor(0x00AE86);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`join-${table.name}`)
                    .setLabel('🎟️ Join Table')
                    .setStyle(ButtonStyle.Success)
            );

            const message = await this.lobbyChannel.send({ embeds: [embed], components: [row] });
            this.tableMessageMap.set(table.name, message.id);
        }

        // Send welcome message last (at the bottom)
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🎉 Welcome to the Casino!')
            .setDescription('Click below to create a new table and start rolling!');

        const welcomeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create-table')
                .setLabel('🎲 Create Table')
                .setStyle(ButtonStyle.Primary)
        );

        const welcomeMsg = await this.lobbyChannel.send({ embeds: [welcomeEmbed], components: [welcomeRow] });
        this.welcomeMessageId = welcomeMsg.id;
    }
}

module.exports = new LobbyManager();
