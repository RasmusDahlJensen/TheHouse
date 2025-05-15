const tableManager = require('../models/tableManager');
const lobbyManager = require('../models/lobbyManager');

/**
 * Handle button interactions
 * @param {import('discord.js').ButtonInteraction} interaction 
 */
async function handleButton(interaction) {
    const [action, tableName] = interaction.customId.split('-');
    const user = interaction.user;

    if (action === 'create') {
        const tableName = `Table ${tableManager.getNextTableId()}`;

        const categoryId = process.env.TABLE_CATEGORY_ID;


        const newChannel = await interaction.guild.channels.create({
            name: tableName.toLowerCase().replace(/\s+/g, '-'),
            type: 0,
            parent: categoryId,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: ['ViewChannel'],
                },
            ],
        });

        const newTable = tableManager.createTable({
            name: tableName,
            channelId: null,
            roleId: null,
            hostUserId: user.id,
            wager: 5000
        });

        await lobbyManager.refreshLobby(interaction.client);
        return interaction.reply({ content: `✅ Created new table: **${newTable.name}**`, ephemeral: true });
    }

    if (action === 'join') {
        const table = tableManager.getTableByName(tableName);
        if (!table) {
            return interaction.reply({ content: '❌ Table not found.', ephemeral: true });
        }

        const alreadyInTable = table.players.some(p => p.user.id === user.id);
        if (alreadyInTable) {
            return interaction.reply({ content: '❌ You are already in this table.', ephemeral: true });
        }

        table.addPlayer(user);
        tableManager.registerUserToTable(user.id, table.name);

        await lobbyManager.refreshLobby(interaction.client);
        return interaction.reply({ content: `✅ You joined **${table.name}**!`, ephemeral: true });
    }
}

module.exports = { handleButton };
