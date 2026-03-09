const { Collection } = require('discord.js');

class TableManager {
    constructor() {
        this.tables = new Collection(); // threadId -> Table Object
        this.userTableMap = new Collection(); // userId -> threadId
        this.lastTableId = 0;
    }

    generateTableId() {
        this.lastTableId += 1;
        return this.lastTableId;
    }

    createTable(threadId, tableId, gameType, hostUser) {
        const table = {
            threadId,
            tableId,
            gameType,
            status: 'lobby', // 'lobby', 'playing', 'finished'
            hostId: hostUser.id,
            players: [
                { id: hostUser.id, username: hostUser.username }
            ],
            gameState: {} // Game specific state
        };
        this.tables.set(threadId, table);
        this.userTableMap.set(hostUser.id, threadId);
        return table;
    }

    getTable(threadId) {
        return this.tables.get(threadId);
    }

    getUserTable(userId) {
        const threadId = this.userTableMap.get(userId);
        if (!threadId) return null;
        return this.tables.get(threadId);
    }

    getAllTables() {
        return this.tables;
    }

    getTableNumericId(threadId) {
        const table = this.tables.get(threadId);
        return table ? table.tableId : '?';
    }

    addPlayer(threadId, user) {
        const table = this.tables.get(threadId);
        if (table && !table.players.find(p => p.id === user.id)) {
            table.players.push({ id: user.id, username: user.username });
            this.userTableMap.set(user.id, threadId);
            return true;
        }
        return false;
    }

    removePlayer(threadId, userId) {
        const table = this.tables.get(threadId);
        if (table) {
            table.players = table.players.filter(p => p.id !== userId);
            this.userTableMap.delete(userId);
            return true;
        }
        return false;
    }

    deleteTable(threadId) {
        const table = this.tables.get(threadId);
        if (table) {
            for (const player of table.players) {
                this.userTableMap.delete(player.id);
            }
            this.tables.delete(threadId);
        }
    }
}

module.exports = new TableManager();
