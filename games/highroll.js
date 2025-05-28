// games/highroll.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { sleep } = require('../utils/animationUtils'); // Assuming animationUtils has sleep

const DICE_ANIMATION_SYMBOLS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

class HighRollGame {
    static id = 'highroll';
    static name = 'High Roll';
    static description = 'Highest roll wins!';
    static minPlayers = 1;
    static maxPlayers = 10;

    static initializeGameState(table) {
        table.gameState = {
            type: this.id,
            rolls: {}, 
            isRolling: {}, // playerId: boolean
            currentDisplay: {}, // playerId: string (for animation frame or actual roll)
            winnerMessage: null,
        };
        table.resetPlayersReadyStatus();
    }

    static buildEmbed(table) {
        const embed = new EmbedBuilder()
            .setTitle(`🎯 ${table.displayName} - ${this.name}`) // Changed emoji
            .setColor(0x0099FF)
            .setDescription(`Wager: **${table.wager.toLocaleString()}** gold.\n*${this.description}*\n`)
            .setFooter({ text: `Game Phase: ${table.gamePhase}` });

        if (table.players.length > 0) {
            // Sort players by their roll (descending) for the leaderboard
            const sortedPlayers = [...table.players].sort((a, b) => {
                const rollA = table.gameState.rolls?.[a.id] || 0;
                const rollB = table.gameState.rolls?.[b.id] || 0;
                if (rollB !== rollA) return rollB - rollA;
                return a.displayName.localeCompare(b.displayName);
            });

            let playerListValue = "";
            sortedPlayers.forEach((player, index) => {
                const readyStatus = player.ready ? '✅ Ready' : '❌ Not Ready';
                let rollDisplay = "";

                if (table.gamePhase === 'playing' || table.gamePhase === 'results') {
                    if (table.gameState.isRolling?.[player.id]) {
                        rollDisplay = ` ${table.gameState.currentDisplay?.[player.id] || '🎲'} Rolling...`;
                    } else if (table.gameState.rolls?.[player.id] !== undefined && table.gameState.rolls?.[player.id] !== null) { // Check if roll exists
                        const roll = table.gameState.rolls[player.id];
                        rollDisplay = ` **${roll}**`;
                    } else {
                        rollDisplay = " (Waiting)";
                    }
                }
                const rank = (table.gamePhase === 'playing' || table.gamePhase === 'results') ? `${index + 1}. ` : '';
                playerListValue += `${rank}**${player.displayName}**:${table.gamePhase === 'readying' ? ` ${readyStatus}` : ''}${rollDisplay}\n`;
            });
            embed.addFields({ name: `Players (${table.players.length}) & Rolls`, value: playerListValue || "No players yet." });
        } else {
            embed.addFields({ name: 'Players', value: "No players have joined yet." });
        }

        if (table.gamePhase === 'results' && table.gameState.winnerMessage) {
            embed.addFields({ name: '🏆 Results 🏆', value: table.gameState.winnerMessage });
            embed.setFooter({ text: "Game Over!" });
        } else if (table.gamePhase === 'playing') {
            embed.setFooter({ text: "Rolling in progress..." });
        } else if (table.gamePhase === 'readying') {
            embed.setDescription(embed.data.description + "\nClick 'Ready Up' when you're set!");
        }
        return embed;
    }

    // buildComponents remains largely the same, just ensure custom IDs are correct

    static buildComponents(table) { // Re-pasting for completeness, ensure it's correct
        const rows = [];
        let primaryRow = new ActionRowBuilder();

        if (table.gamePhase === 'readying') {
            primaryRow.addComponents(
                new ButtonBuilder().setCustomId(`gameaction-${this.id}-ready-${table.name}`).setLabel('👍 Ready Up / 👎 Unready').setStyle(ButtonStyle.Success)
            );
        } else if (table.gamePhase === 'results') {
            primaryRow.addComponents(
                new ButtonBuilder().setCustomId(`gameaction-${this.id}-playagain-${table.name}`).setLabel('🔄 Play Again').setStyle(ButtonStyle.Primary)
            );
        }

        if (table.gamePhase !== 'playing') {
            if (primaryRow.components.length < 4) {
                primaryRow.addComponents(
                    new ButtonBuilder().setCustomId(`changegame-${table.name}`).setLabel('⏪ Change Game').setStyle(ButtonStyle.Secondary)
                );
            } else {
                rows.push(primaryRow);
                primaryRow = new ActionRowBuilder();
                primaryRow.addComponents(
                    new ButtonBuilder().setCustomId(`changegame-${table.name}`).setLabel('⏪ Change Game').setStyle(ButtonStyle.Secondary)
                );
            }
        }

        if (primaryRow.components.length > 0) rows.push(primaryRow);

        let leaveRow = rows.length > 0 ? rows[rows.length - 1] : null;
        if (!leaveRow || leaveRow.components.length >= (table.gamePhase === 'playing' ? 5 : 4)) { // Max 5, but if change game is there, it's 4 for leave
            leaveRow = new ActionRowBuilder();
            rows.push(leaveRow);
        }
        leaveRow.addComponents(
            new ButtonBuilder().setCustomId(`leave-${table.name}`).setLabel('🚪 Leave Table').setStyle(ButtonStyle.Danger)
        );

        return rows.filter(row => row.components.length > 0);
    }


    static async handlePlayerAction(actionDetails, table, interaction, client) {
        // ... (ready and playagain logic from before, ensure it calls this.initializeGameState for playagain)
        const action = actionDetails;

        if (action === 'ready') {
            const player = table.players.find(p => p.id === interaction.user.id);
            if (!player) {
                // Should not happen if interaction is from a button only visible to players
                // but good to have a check or rely on buttonHandler's prior check.
                // For now, assume buttonHandler did its job.
            }
            table.setPlayerReady(interaction.user.id, !player.ready);

            if (table.allPlayersReady()) {
                await interaction.deferUpdate();
                await this.startGame(table, client, interaction); // Pass interaction
            } else {
                await interaction.deferUpdate();
            }
        } else if (action === 'playagain') {
            this.initializeGameState(table); // Reset game state for highroll
            table.gamePhase = 'readying';
            table.resetPlayersReadyStatus(); // Also explicitly reset ready status for all players
            await interaction.deferUpdate();
        }
    }

    static async startGame(table, client, interaction) { // interaction can be null if started programmatically
        table.gamePhase = 'playing';
        console.log(`[HIGHROLL_DEBUG] Starting game for table ${table.name}. Players: ${table.players.map(p => p.displayName).join(', ')}`);

        const channel = await client.channels.fetch(table.channelId);
        const gameMessage = await channel.messages.fetch(table.messageId);
        if (!gameMessage) {
            console.error(`[HIGHROLL_DEBUG] Cannot start game for ${table.name}, game message not found.`);
            const currentChannel = await client.channels.fetch(table.channelId).catch(() => null);
            if (currentChannel) await currentChannel.send('Error: Main game message not found. Please try re-selecting the game.');
            table.clearGame();
            // The calling context (buttonHandler) will update the message after this returns.
            return;
        }

        const update = async () => {
            const embed = this.buildEmbed(table);
            const components = this.buildComponents(table); // Components might change (e.g., disable buttons during roll)
            await gameMessage.edit({ embeds: [embed], components: components }).catch(err => {
                console.error(`[HIGHROLL_DEBUG] Error updating game message during startGame for table ${table.name}:`, err)
            });
        };
        await update(); // Initial "playing" state update

        for (const player of table.players) {
            table.gameState.isRolling[player.id] = true;
            table.gameState.currentDisplay[player.id] = DICE_ANIMATION_SYMBOLS[0]; // Initial rolling display
            await update();
            await sleep(300);

            // **** THE ACTUAL ROLL (1-100) ****
            const actualRollResult = Math.floor(Math.random() * 100) + 1;
            console.log(`[HIGHROLL_DEBUG] Player ${player.displayName} (ID: ${player.id}) rolled: ${actualRollResult}`);

            // Animation Loop (visual flair, doesn't use actualRollResult until the end)
            const animationFrames = 7; // More frames for a slightly longer animation for 1-100
            const frameDelay = 1500 / animationFrames; // Adjust total duration as needed
            for (let i = 0; i < animationFrames; i++) {
                const randomSymbolIndex = Math.floor(Math.random() * DICE_ANIMATION_SYMBOLS.length);
                table.gameState.currentDisplay[player.id] = DICE_ANIMATION_SYMBOLS[randomSymbolIndex];
                await update();
                await sleep(frameDelay);
            }

            table.gameState.rolls[player.id] = actualRollResult; // Store the 1-100 roll
            table.gameState.isRolling[player.id] = false;
            table.gameState.currentDisplay[player.id] = `**${actualRollResult}**`; // For buildEmbed to pick up immediately

            console.log(`[HIGHROLL_DEBUG] Stored roll for ${player.displayName}: ${table.gameState.rolls[player.id]}`);
            await update(); // Show final roll for this player & update leaderboard
            await sleep(750); // Pause between players
        }

        table.gamePhase = 'results';
        let highScore = 0;
        let winners = []; // Can be multiple winners in case of a tie

        console.log('[HIGHROLL_DEBUG] All rolls complete. Determining winner from rolls:', JSON.stringify(table.gameState.rolls));

        table.players.forEach(p => {
            const roll = table.gameState.rolls[p.id];
            if (roll === undefined || roll === null) {
                console.warn(`[HIGHROLL_DEBUG] Player ${p.displayName} has no roll recorded in gameState!`);
                return; // Skip players with no roll
            }
            if (roll > highScore) {
                highScore = roll;
                winners = [p.displayName]; // New high score, new winner list
            } else if (roll === highScore) {
                winners.push(p.displayName); // Tied for high score
            }
        });

        if (winners.length > 0) {
            table.gameState.winnerMessage = `🏆 ${winners.join(' & ')} win${winners.length === 1 ? 's' : ''} with a roll of **${highScore}**!`;
        } else if (table.players.length > 0) {
            table.gameState.winnerMessage = "No valid rolls recorded, or everyone rolled 0. It's a bizarre draw!";
        } else {
            table.gameState.winnerMessage = "No players were in the game to determine a winner.";
        }
        console.log(`[HIGHROLL_DEBUG] Winner message: ${table.gameState.winnerMessage}`);

        // The final update to show results and "Play Again" will be triggered by buttonHandler
        // after this startGame function completes and control returns.
    }
}

module.exports = HighRollGame;