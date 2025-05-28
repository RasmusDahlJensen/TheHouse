class Table {
    constructor(options) {
        this.name = options.name;
        this.displayName = options.displayName;
        this.channelId = options.channelId;
        this.roleId = options.roleId;
        this.hostUserId = options.hostUserId;
        this.wager = options.wager || 5000;
        this.players = [];
        this.messageId = options.messageId || null;
        this.createdAt = options.createdAt || Date.now();
        this.gameType = null;
        this.gameState = null;
    }

    addPlayer(user, memberDisplayName) {
        if (!this.players.some(p => p.user.id === user.id)) {
            this.players.push({
                user: user,
                id: user.id,
                displayName: memberDisplayName || user.username,
                ready: false
            });
        }
    }

    removePlayer(userId) {
        this.players = this.players.filter(p => p.user.id !== userId);
    }

    isEmpty() {
        return this.players.length === 0;
    }

    setMessageId(id) {
        this.messageId = id;
    }

    setPlayerReady(userId, isReady) {
        const player = this.players.find(p => p.id === userId);
        if (player) {
            player.ready = isReady;
            return true;
        }
        return false;
    }

    allPlayersReady() {
        if (this.players.length === 0) return false;
        return this.players.every(p => p.ready);
    }

    resetPlayersReadyStatus() {
        this.players.forEach(p => p.ready = false);
    }

    clearGame() {
        this.currentGameId = null;
        this.gamePhase = 'lobby';
        this.gameState = {};
        this.resetPlayersReadyStatus();
    }
}

module.exports = Table;