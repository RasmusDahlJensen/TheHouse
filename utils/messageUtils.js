const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const games = require('../data/games');

/**
 * Builds and sends the initial game selection embed for a table.
 * @param {import('discord.js').TextChannel} tableChannel The channel to send the message to.
 * @param {object} tableObject The table object from tableManager.
 */
async function sendInitialTableMessage(tableChannel, tableObject) {
    const gameList = games.map(g => `• **${g.name}** – ${g.description}`).join('\n');
    const playerNames = tableObject.players.map(p => `- ${p.displayName || p.user.username}`).join('\n') || 'No players yet.';

    const embed = new EmbedBuilder()
        .setTitle(`🎰 Welcome to ${tableObject.displayName}`)
        .setDescription(`**Choose a game to begin:**\n${gameList}\n\n**Players:**\n${playerNames}`)
        .setFooter({ text: 'Click a game button below to start! Or use "Leave Table".' })
        .setColor(0xFFD700);

    const gameButtons = new ActionRowBuilder();
    games.forEach(game => {
        gameButtons.addComponents(
            new ButtonBuilder()
                .setCustomId(`game-${game.id}-${tableObject.name}`)
                .setLabel(game.name)
                .setStyle(ButtonStyle.Primary)
        );
    });

    const leaveButtonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`leave-${tableObject.name}`)
            .setLabel('🏃 Leave Table')
            .setStyle(ButtonStyle.Danger)
    );

    const message = await tableChannel.send({
        embeds: [embed],
        components: [gameButtons, leaveButtonRow],
    });
    return message;
}

/**
 * Updates the main game embed in a table channel with the current player list.
 * @param {import('discord.js').Client} client
 * @param {object} table The table object from tableManager.
 */
async function updateTableEmbed(client, table) {
    if (!table.channelId || !table.messageId) {
        console.warn(`Table ${table.name} is missing channelId or messageId for embed update.`);
        return;
    }

    try {
        const channel = await client.channels.fetch(table.channelId);
        if (!channel || !channel.isTextBased()) {
            console.warn(`Channel for table ${table.name} not found or not text-based.`);
            return;
        }

        const message = await channel.messages.fetch(table.messageId);
        if (!message) {
            console.warn(`Main message for table ${table.name} not found.`);
            return;
        }

        const existingEmbed = message.embeds[0];
        if (!existingEmbed) {
            console.warn(`No embed found in message for table ${table.name}. Cannot update.`);
            return;
        }

        const playerNames = table.players.map(p => {
            const userDisplay = p.displayName || (p.user ? p.user.username : 'Unknown Player');
            return `- ${userDisplay}${p.ready ? ' (Ready)' : ''}`;
        }).join('\n') || 'No players yet.';

        const newEmbed = EmbedBuilder.from(existingEmbed)
            .setDescription(
                `${existingEmbed.description.split('\n\n**Players:**')[0]}\n\n**Players:**\n${playerNames}`
            );

        await message.edit({ embeds: [newEmbed] });

    } catch (error) {
        console.error(`Error updating embed for table ${table.name}:`, error);
        if (error.code === 10008 || error.code === 10003) {
            console.warn(`Message or Channel for table ${table.name} (ID: ${table.messageId}/${table.channelId}) not found. It might have been deleted.`);
        }
    }
}

module.exports = { sendInitialTableMessage, updateTableEmbed };