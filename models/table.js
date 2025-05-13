class Table {
    constructor(name, channelId, roleId, hostUserId, wager = 5000) {
        this.name = name;
        this.channelId = channelId;
        this.roleId = roleId;
        this.hostUserId = hostUserId;
        this.wager = wager;
        this.players = [];
    }

    addPlayer(user) {
        this.players.push({ user, isReady: false });
    }

    removePlayer(userId) {
        this.players = this.players.filter(p => p.user.id !== userId);
    }

    isEmpty() {
        return this.players.length === 0;
    }
}

module.exports = Table;
