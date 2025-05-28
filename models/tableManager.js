const Table = require('./table');

class TableManager {
    constructor() {
        this.tables = new Map();
        this.userTableMap = new Map();
        this.tableCounter = 1;
    }

    getNextTableId() {
        return this.tableCounter++;
    }

    createTable(options) {
        const table = new Table({
            ...options,
            createdAt: Date.now()
        });
        this.tables.set(table.name, table); 
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
        // remove from any table's player list if they are found
        const tableName = this.userTableMap.get(userId);
        if (tableName) {
            const table = this.tables.get(tableName);
            if (table) {
                table.removePlayer(userId);
            }
        }
        this.userTableMap.delete(userId);
    }

    deleteTable(name) {
        // Ensure users are unregistered from this table
        this.userTableMap.forEach((tableName, userId) => {
            if (tableName === name) {
                this.userTableMap.delete(userId);
            }
        });
        this.tables.delete(name);
    }

    getAllTables() {
        return Array.from(this.tables.values());
    }
}

module.exports = new TableManager();