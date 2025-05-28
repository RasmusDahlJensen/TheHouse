// utils/gameEmbedBuilders.js
const { EmbedBuilder } = require('discord.js');
const gameManager = require('./gameManager');

/**
 * Builds the embed for the table lobby (game selection phase).
 * This is shown when no specific game is active on the table.
 * @param {object} table - The table object from tableManager.
 * @returns {EmbedBuilder}
 */
function buildTableLobbyEmbed(table) {
    const availableGames = gameManager.getAllGameDetails();
    const gameList = availableGames.map(g => `• **${g.name}** – ${g.description}`).join('\n') || 'No games available.';

    const playerNames = table.players.map(p => `- ${p.displayName || p.user.username}`).join('\n') || 'No players yet.';

    return new EmbedBuilder()
        .setTitle(`🎰 ${table.displayName} - Choose a Game`)
        .setDescription(
            `Wager: **${(table.wager || 0).toLocaleString()}** gold.\n\n` +
            `**Available Games:**\n${gameList}\n\n` +
            `**Players (${table.players.length}):**\n${playerNames}`
        )
        .setColor(0xFFD700)
        .setFooter({ text: 'Click a game button below to select it, or use "Leave Table".' });
}

module.exports = { buildTableLobbyEmbed };