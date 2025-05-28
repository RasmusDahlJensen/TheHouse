// managers/GameManager.js
const fs = require('fs');
const path = require('path');

class GameManager {
    constructor() {
        this.games = new Map();
        this.loadGames();
    }

    loadGames() {
        const gamesDir = path.join(__dirname, '../games');
        fs.readdirSync(gamesDir)
            .filter(file => file.endsWith('.js'))
            .forEach(file => {
                try {
                    const gameModule = require(path.join(gamesDir, file));
                    if (gameModule && gameModule.id && typeof gameModule.buildEmbed === 'function') {
                        this.games.set(gameModule.id, gameModule);
                        console.log(`🎲 Game loaded: ${gameModule.name} (ID: ${gameModule.id})`);
                    } else {
                        console.warn(`⚠️ Could not load game from ${file}: Missing id or required methods.`);
                    }
                } catch (error) {
                    console.error(`❌ Error loading game from ${file}:`, error);
                }
            });
    }

    getGame(gameId) {
        return this.games.get(gameId);
    }

    getAllGameDetails() {
        return Array.from(this.games.values()).map(game => ({
            id: game.id,
            name: game.name,
            description: game.description
        }));
    }

    initializeTableForGame(table, gameId) {
        const game = this.getGame(gameId);
        if (game) {
            table.currentGameId = gameId;
            table.gamePhase = 'readying'; 
            game.initializeGameState(table);
            return true;
        }
        return false;
    }

    buildTableEmbed(table) {
        const game = this.getGame(table.currentGameId);
        if (game) {
            return game.buildEmbed(table);
        }
        const { buildTableLobbyEmbed } = require('../utils/gameEmbedBuilders'); 
        return buildTableLobbyEmbed(table);
    }

    buildTableComponents(table) {
        const game = this.getGame(table.currentGameId);
        if (game) {
            return game.buildComponents(table);
        }
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const rows = [];
        const gameSelectRow = new ActionRowBuilder();
        this.getAllGameDetails().forEach(g => {
            gameSelectRow.addComponents(
                new ButtonBuilder().setCustomId(`selectgame-${g.id}-${table.name}`).setLabel(g.name).setStyle(ButtonStyle.Primary)
            );
        });
        if (gameSelectRow.components.length > 0) rows.push(gameSelectRow);

        const leaveRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`leave-${table.name}`).setLabel('🚪 Leave Table').setStyle(ButtonStyle.Danger)
        );
        rows.push(leaveRow);
        return rows;
    }

    async dispatchGameAction(table, actionPath, interaction, client) {
        const game = this.getGame(table.currentGameId);
        if (game && typeof game.handlePlayerAction === 'function') {
            const gameSpecificAction = actionPath; 
            await game.handlePlayerAction(gameSpecificAction, table, interaction, client);
            return true;
        }
        return false;
    }

    async startGameForTable(table, client, interaction) {
        const game = this.getGame(table.currentGameId);
        if (game && typeof game.startGame === 'function') {
            await game.startGame(table, client, interaction);
            return true;
        }
        return false;
    }
}

module.exports = new GameManager();