// utils/buttonHandler.js
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const tableManager = require('../models/tableManager');
const lobbyManager = require('../models/lobbyManager');
const gameManager = require('../utils/gameManager');
const { createTableChannelAndRole } = require('./channelUtils');

// Helper to fetch the game message (make sure this is robust)
async function fetchGameMessage(client, table) {
    if (!table || !table.channelId || !table.messageId) {
        console.warn(`Table ${table?.name || 'Unknown'} missing channelId or messageId for fetchGameMessage.`);
        return null;
    }
    try {
        const channel = await client.channels.fetch(table.channelId);
        if (!channel || !channel.isTextBased()) return null;
        return await channel.messages.fetch(table.messageId);
    } catch (error) {
        console.error(`Error fetching game message for table ${table.name}:`, error.message);
        if (error.code === 10008 || error.code === 10003) {
            console.warn(`Message or Channel for table ${table.name} (ID: ${table.messageId}/${table.channelId}) not found.`);
        }
        return null;
    }
}


// Helper to update the game message using GameManager
async function updateTableMessage(client, table) {
    if (!table) {
        console.warn("updateTableMessage called with null table.");
        return;
    }
    const gameMessage = await fetchGameMessage(client, table);
    if (gameMessage) {
        const embed = gameManager.buildTableEmbed(table);
        const components = gameManager.buildTableComponents(table);
        try {
            await gameMessage.edit({ embeds: [embed], components: components });
        } catch (err) {
            console.error(`Error editing game message ${gameMessage.id} for table ${table.name}:`, err);
            if (err.code === 10008) {
                console.warn(`Game message ${gameMessage.id} for table ${table.name} was deleted. Clearing stored messageId.`);
                table.setMessageId(null);
            }
        }
    } else {
        console.warn(`Could not update message for table ${table.name}, game message not found. Attempting to resend.`);
        const channel = await client.channels.fetch(table.channelId).catch(() => null);
        if (channel && table.channelId) {
            console.log(`Attempting to resend message for table ${table.name} in channel ${channel.id}`);
            const embed = gameManager.buildTableEmbed(table);
            const components = gameManager.buildTableComponents(table);
            try {
                const newMessage = await channel.send({ embeds: [embed], components });
                table.setMessageId(newMessage.id);
                console.log(`Resent message for table ${table.name}, new ID: ${newMessage.id}`);
            } catch (sendError) {
                console.error(`Failed to resend message for table ${table.name}:`, sendError);
            }
        }
    }
}


async function handleButton(interaction) {
    console.log(`Button Interaction: ${interaction.customId} by ${interaction.user.tag}`);

    const customIdParts = interaction.customId.split('-');
    const action = customIdParts[0];
    const user = interaction.user;
    const client = interaction.client;

    let tableNameForAction;
    let gameIdForAction;
    let gameSpecificAction;

    // --- Custom ID Parsing ---
    if (action === 'create') {
    } else if (action === 'selectgame') {
        gameIdForAction = customIdParts[1];
        tableNameForAction = customIdParts.slice(2).join('-');
    } else if (action === 'gameaction') {
        gameIdForAction = customIdParts[1];
        gameSpecificAction = customIdParts[2];
        tableNameForAction = customIdParts.slice(3).join('-');
    } else if (action === 'changegame') {
        tableNameForAction = customIdParts.slice(1).join('-');
    } else {
        tableNameForAction = customIdParts.slice(1).join('-');
    }

    // --- Action: Create Table ---
    if (action === 'create') {
        if (tableManager.getTableByUser(user.id)) {
            return interaction.reply({ content: '❌ You are already in a table. Leave it before starting a new one.', ephemeral: true });
        }
        const tableNumericId = tableManager.getNextTableId();
        const baseTableName = `table-${tableNumericId}`;
        const displayTableName = `Table ${tableNumericId}`;

        try {
            const { channel, role } = await createTableChannelAndRole(interaction.guild, baseTableName);
            const newTable = tableManager.createTable({
                name: baseTableName, displayName: displayTableName, channelId: channel.id, roleId: role.id, hostUserId: user.id, wager: 5000,
            });
            newTable.addPlayer(user, interaction.member.displayName || user.username);
            tableManager.registerUserToTable(user.id, newTable.name);
            await interaction.member.roles.add(role);

            const initialEmbed = gameManager.buildTableEmbed(newTable);
            const initialComponents = gameManager.buildTableComponents(newTable);
            const gameMsg = await channel.send({ embeds: [initialEmbed], components: initialComponents });
            newTable.setMessageId(gameMsg.id);

            await lobbyManager.refreshLobby(client);
            return interaction.reply({ content: `✅ Created table **${newTable.displayName}**! <#${channel.id}>`, ephemeral: true });
        } catch (error) {
            console.error("Error creating table via button:", error);
            return interaction.reply({ content: `❌ Error creating table: ${error.message || 'An unexpected error occurred.'}`, ephemeral: true });
        }
    }

    // --- Fetch Table for other actions ---
    const table = tableNameForAction ? tableManager.getTableByName(tableNameForAction) : tableManager.getTableByUser(user.id);

    if (!table) {
        return interaction.reply({ content: '❌ Table context not found. The table might have been closed or an error occurred.', ephemeral: true });
    }

    const isPlayerAtThisTable = table.players.some(p => p.id === user.id);
    if (action !== 'join' && !isPlayerAtThisTable) {
        return interaction.reply({ content: '❌ You are not currently a player at this table.', ephemeral: true });
    }

    // --- Handle Actions ---
    let interactionHandled = false;

    try {
        if (action === 'join') {
            if (tableManager.getTableByUser(user.id)) {
                await interaction.reply({ content: '❌ You are already in a table!', ephemeral: true });
                interactionHandled = true;
            } else if (table.players.some(p => p.id === user.id)) {
                await interaction.reply({ content: '❌ You are already in this specific table!', ephemeral: true });
                interactionHandled = true;
            } else {
                table.addPlayer(user, interaction.member.displayName || user.username);
                tableManager.registerUserToTable(user.id, table.name);
                const role = interaction.guild.roles.cache.get(table.roleId);
                if (role) await interaction.member.roles.add(role).catch(console.error);
                await interaction.deferUpdate().catch(console.error);
                interactionHandled = true;
                await lobbyManager.refreshLobby(client);
            }
        } else if (action === 'leave') {
            table.removePlayer(user.id);
            tableManager.unregisterUser(user.id);
            const role = interaction.guild.roles.cache.get(table.roleId);
            if (role && interaction.member.roles.cache.has(role.id)) {
                await interaction.member.roles.remove(role).catch(console.error);
            }

            if (table.isEmpty()) {
                await interaction.reply({ content: `👋 You left ${table.displayName}. The table is now empty and has been closed.`, ephemeral: true });
                interactionHandled = true;

                const channel = await client.channels.fetch(table.channelId).catch(() => null);
                if (channel) {
                    await channel.delete(`Table ${table.displayName} empty.`).catch(err => {
                        if (err.code !== 10003) console.error(`Error deleting channel ${table.channelId}:`, err);
                    });
                }
                if (role) {
                    await role.delete(`Table ${table.displayName} role no longer needed.`).catch(err => {
                        if (err.code !== 10007) console.error(`Error deleting role ${role.id}:`, err);
                    });
                }
                tableManager.deleteTable(table.name);
                await lobbyManager.refreshLobby(client);
            } else {
                await interaction.deferUpdate().catch(console.error);
                interactionHandled = true;
                await lobbyManager.refreshLobby(client);
            }
        } else if (action === 'selectgame') {
            if (gameManager.initializeTableForGame(table, gameIdForAction)) {
                await interaction.deferUpdate().catch(console.error);
                interactionHandled = true;
            } else {
                await interaction.reply({ content: '❌ Invalid game selected or an error occurred during initialization.', ephemeral: true });
                interactionHandled = true;
            }
        } else if (action === 'changegame') {
            table.clearGame();
            await interaction.deferUpdate().catch(console.error);
            interactionHandled = true;
        } else if (action === 'gameaction') {
            if (table.currentGameId !== gameIdForAction) {
                await interaction.reply({ content: '❌ This action is for a different game than what is currently active.', ephemeral: true });
                interactionHandled = true;
            } else {
                await gameManager.dispatchGameAction(table, gameSpecificAction, interaction, client);
                interactionHandled = interaction.replied || interaction.deferred;
            }
        }

        // --- Update Table Message (if not a terminal action like table deletion) ---
        if (interactionHandled && interaction.deferred && action !== 'leave' || (action === 'leave' && !table.isEmpty())) {
            await updateTableMessage(client, table);
        } else if (action === 'leave' && table.isEmpty()) {
        }


    } catch (error) {
        console.error(`Error in handleButton for action "${action}", customId "${interaction.customId}":`, error);
        if (!interactionHandled) {
            try {
                await interaction.reply({ content: '❌ An unexpected error occurred while processing your action.', ephemeral: true });
            } catch (replyError) {
                console.error("Failed to send error reply to interaction:", replyError);
            }
            interactionHandled = true;
        }
    }

    if (!interactionHandled && !interaction.replied && !interaction.deferred) {
        console.warn(`Interaction ${interaction.customId} by ${user.tag} reached end of handler without reply/defer.`);
        await interaction.reply({ content: '⚙️ Your action was acknowledged.', ephemeral: true }).catch(console.error);
    }
}

module.exports = { handleButton };