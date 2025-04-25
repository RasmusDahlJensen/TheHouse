class Table {
    constructor(name, wager, hostUserId) {
        this.name = name;
        this.wager = wager;
        this.hostUserId = hostUserId;
        this.players = [];
        this.createdAt = Date.now();
    }

    addPlayer(user, isBot = false) {
        if (this.players.some(p => p.user.id === user.id)) return false;
        this.players.push({ user, roll: null, isBot });
        return true;
    }

    removePlayer(userId) {
        this.players = this.players.filter(p => p.user.id !== userId);
    }

    isEmpty() {
        return this.players.length === 0;
    }

    getDisplayList() {
        return this.players.map((p, i) => `${i + 1}. ${p.user.username}${p.isBot ? ' [BOT]' : ''}`).join('\n');
    }

    getPlayer(userId) {
        return this.players.find(p => p.user.id === userId);
    }

    hasPlayer(userId) {
        return this.players.some(p => p.user.id === userId);
    }
}

module.exports = Table;
