const Table = require('./Table');

class TableManager {
    constructor() {
        this.tables = new Map();
        this.userTableMap = new Map();
        this.tableCounter = 1;
    }

    createTable(wager, user) {
        const name = `Table ${this.tableCounter++}`;
        const table = new Table(name, wager, user.id);
        table.addPlayer(user);
        this.tables.set(name, table);
        this.userTableMap.set(user.id, name);
        return table;
    }

    getTableByName(name) {
        return this.tables.get(name);
    }

    getTableByUser(userId) {
        const name = this.userTableMap.get(userId);
        return name ? this.tables.get(name) : null;
    }

    registerUserToTable(userId, tableName) {
        this.userTableMap.set(userId, tableName);
    }

    unregisterUser(userId) {
        this.userTableMap.delete(userId);
    }

    deleteTable(name) {
        this.tables.delete(name);
    }

    getAllTables() {
        return Array.from(this.tables.values());
    }

    removePlayer(userId) {
        this.players = this.players.filter(p => p.user.id !== userId);
    }
    
}

module.exports = new TableManager();
