const { EmbedBuilder } = require('discord.js');
const DICE_ANIMATION_FRAMES = ['🎲', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/**
 * Pauses execution for a given number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulates a dice roll animation for a player within a table's game embed.
 * @param {import('discord.js').Message} gameMessage - The message object containing the game embed.
 * @param {object} table - The table object from tableManager.
 * @param {string} playerId - The ID of the player who is rolling.
 * @param {number} finalRoll - The actual result of the dice roll (1-6).
 * @param {Function} buildEmbedFunction - A function that takes the 'table' object and returns a new EmbedBuilder instance
 *                                        representing the current game state. This function will be responsible for
 *                                        updating the specific player's display based on table.gameState.
 */
async function animateDiceRoll(gameMessage, table, playerId, finalRoll, buildEmbedFunction) {
    const playerState = table.gameState.players.find(p => p.userId === playerId);
    if (!playerState) return;

    const animationDuration = 1500;
    const frames = 5;
    const frameDelay = animationDuration / frames;

    playerState.isRolling = true;

    for (let i = 0; i < frames; i++) {
        const randomFrameIndex = Math.floor(Math.random() * DICE_ANIMATION_FRAMES.length);
        playerState.currentDisplay = DICE_ANIMATION_FRAMES[randomFrameIndex];

        const updatedEmbed = buildEmbedFunction(table);
        await gameMessage.edit({ embeds: [updatedEmbed] }).catch(console.error);
        await sleep(frameDelay);
    }

    // Set the final roll
    playerState.roll = finalRoll;
    playerState.isRolling = false;
    const finalDiceFace = DICE_ANIMATION_FRAMES[finalRoll] || DICE_ANIMATION_FRAMES[0]; 
    playerState.currentDisplay = `${finalDiceFace} (Rolled: ${finalRoll})`;

    const finalEmbed = buildEmbedFunction(table);
    await gameMessage.edit({ embeds: [finalEmbed] }).catch(console.error);
}

module.exports = { animateDiceRoll, sleep };