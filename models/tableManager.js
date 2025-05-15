const Table = require('./table');

class TableManager {
    constructor() {
        this.tables = new Map()
        this.userTableMap = new Map();
        this.tableCounter = 1;
    }

    getNextTableId() {
        return this.tableCounter++;
    }

    createTable({ name, channelId, roleId, hostUserId, wager }) {
        const table = new Table(name, channelId, roleId, hostUserId, wager);
        this.tables.set(name, table);
        return table;
    }

    getTableByName(name) {
        return this.tables.get(name);
    }

    getTableByUser(userId) {
        const tableName = this.userTableMap.get(userId);
        return tableName ? this.tables.get(tableName) : null;
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

    getAllTables(){
        return Array.from(this.tables.values())
    }
}

module.exports = new TableManager();
