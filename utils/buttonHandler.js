const tableManager = require('./tableManager');
const lobbyManager = require('./lobbyManager');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const rollGame = require('../games/roll');
const deathrollGame = require('../games/deathroll');

async function handleButton(interaction) {
    const action = interaction.customId;

    if (action === 'create_table_roll') {
        return createTableFromLobby(interaction, 'roll');
    } else if (action === 'create_table_deathroll') {
        return createTableFromLobby(interaction, 'deathroll');
    } else if (action === 'join_table_menu') {
        return handleJoinFromMenu(interaction);
    }

    const threadId = interaction.channel.id;
    const table = tableManager.getTable(threadId);

    // If there is no table tracked for this thread, ignore or close
    if (!table) {
        if (['join_table', 'leave_table', 'start_game', 'roll_action', 'play_again', 'close_table'].includes(action)) {
            return interaction.reply({ content: '❌ Table data not found. This table might have been closed or the bot restarted.', ephemeral: true });
        }
        return; // Ignore other buttons if not relevant
    }

    try {
        if (action === 'join_table') {
            await handleJoin(interaction, table);
        } else if (action === 'leave_table') {
            await handleLeave(interaction, table);
        } else if (action === 'start_game') {
            await handleStart(interaction, table);
        } else if (action === 'roll_action') {
            await handleRollAction(interaction, table);
        } else if (action === 'play_again') {
            await handlePlayAgain(interaction, table);
        } else if (action === 'close_table') {
            await handleCloseTable(interaction, table);
        }
    } catch (error) {
        console.error(`Error handling button ${action}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ An error occurred processing this action.', ephemeral: true });
        }
    }
}

async function updateLobbyMessage(interaction, table) {
    const embed = new EmbedBuilder()
        .setTitle(`🎰 Table - ${table.gameType.toUpperCase()}`)
        .setDescription(`**Host**: <@${table.hostId}>\n**Status**: Waiting for players\n\n**Players Joined**:\n${table.players.map(p => `- ${p.username}`).join('\n')}`)
        .setColor('#2ecc71');

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('join_table')
                .setLabel('Join')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('leave_table')
                .setLabel('Leave Table')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('start_game')
                .setLabel('Start Game')
                .setStyle(ButtonStyle.Primary)
        );

    try {
        if (table.messageId) {
            try {
                const oldMsg = await interaction.channel.messages.fetch(table.messageId);
                await oldMsg.delete();
            } catch (err) {}
        }
        
        const newMsg = await interaction.channel.send({ embeds: [embed], components: [row] });
        table.messageId = newMsg.id;
    } catch (e) {
        console.error("Failed to update message: ", e);
    }
}

async function handleJoin(interaction, table) {
    if (table.status !== 'lobby') {
        return interaction.reply({ content: '❌ You cannot join while a game is in progress.', ephemeral: true });
    }
    
    // Check if user is already in another table
    const existingTable = tableManager.getUserTable(interaction.user.id);
    if (existingTable && existingTable.threadId !== table.threadId) {
        return interaction.reply({ content: '❌ You are already at another table.', ephemeral: true });
    }

    if (tableManager.addPlayer(table.threadId, interaction.user)) {
        await interaction.channel.members.add(interaction.user.id);
        
        await interaction.deferUpdate();
        await updateLobbyMessage(interaction, table);
        await lobbyManager.updateLobby(interaction.client);
    } else {
        return interaction.reply({ content: '❌ You are already in this table.', ephemeral: true });
    }
}

async function handleLeave(interaction, table) {
    const isPlayer = table.players.find(p => p.id === interaction.user.id);
    if (!isPlayer) {
        return interaction.reply({ content: '❌ You are not at this table.', ephemeral: true });
    }

    tableManager.removePlayer(table.threadId, interaction.user.id);
    
    try {
        // Kick them from thread
        await interaction.channel.members.remove(interaction.user.id);
    } catch(err) {
        console.error(err);
    }

    await interaction.reply({ content: '👋 You left the table.', ephemeral: true });

    if (table.players.length === 0) {
        tableManager.deleteTable(table.threadId);
        await interaction.channel.delete('Table empty');
        await lobbyManager.updateLobby(interaction.client);
    } else {
        // If host leaves, assign a new host
        if (table.hostId === interaction.user.id && table.players.length > 0) {
            table.hostId = table.players[0].id;
        }
        
        if (table.status === 'lobby') {
            await updateLobbyMessage(interaction, table);
        } else {
            // Let the game handle someone leaving during a game
            if (table.gameType === 'roll') {
                await rollGame.handleLeave(interaction, table);
            } else if (table.gameType === 'deathroll') {
                await deathrollGame.handleLeave(interaction, table);
            }
        }
        await lobbyManager.updateLobby(interaction.client);
    }
}

async function handleStart(interaction, table) {
    if (interaction.user.id !== table.hostId) {
        return interaction.reply({ content: '❌ Only the host can start the game.', ephemeral: true });
    }
    if (table.status !== 'lobby') {
        return interaction.reply({ content: '❌ Game is already in progress.', ephemeral: true });
    }

    if (table.gameType === 'roll') {
        if (table.players.length < 1) {
             return interaction.reply({ content: '❌ Need at least 1 player.', ephemeral: true });
        }
        table.status = 'playing';
        await rollGame.start(interaction, table);
    } else if (table.gameType === 'deathroll') {
        if (table.players.length !== 2) {
            return interaction.reply({ content: '❌ Deathroll requires exactly 2 players.', ephemeral: true });
        }
        table.status = 'playing';
        await deathrollGame.start(interaction, table);
    }
}

async function handleRollAction(interaction, table) {
    if (table.status !== 'playing') {
        return interaction.reply({ content: '❌ No game is currently active.', ephemeral: true });
    }

    if (table.gameType === 'roll') {
        await rollGame.handleRoll(interaction, table);
    } else if (table.gameType === 'deathroll') {
        await deathrollGame.handleRoll(interaction, table);
    }
}

async function handlePlayAgain(interaction, table) {
    if (interaction.user.id !== table.hostId) {
         return interaction.reply({ content: '❌ Only the host can restart the lobby.', ephemeral: true });
    }
    
    // Reset table state
    table.status = 'lobby';
    table.gameState = {};
    
    await interaction.deferUpdate();
    await updateLobbyMessage(interaction, table);
}

async function handleCloseTable(interaction, table) {
    if (interaction.user.id !== table.hostId) {
         return interaction.reply({ content: '❌ Only the host can close the table.', ephemeral: true });
    }
    
    tableManager.deleteTable(table.threadId);
    await interaction.reply({ content: 'Closing table...', ephemeral: true });
    await interaction.channel.delete('Host closed table');
    await lobbyManager.updateLobby(interaction.client);
}

async function createTableFromLobby(interaction, gameType) {
    if (tableManager.getUserTable(interaction.user.id)) {
        return interaction.reply({ content: '❌ You are already at a table! Please leave it first before creating a new one.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        const tableId = tableManager.generateTableId();
        const threadName = `Table ${tableId} - ${gameType.toUpperCase()}`;
        
        const thread = await interaction.channel.threads.create({
            name: threadName,
            autoArchiveDuration: 60,
            type: ChannelType.PrivateThread,
            reason: `Casino table requested by ${interaction.user.tag}`
        });

        await thread.members.add(interaction.user.id);
        const table = tableManager.createTable(thread.id, tableId, gameType, interaction.user);

        const embed = new EmbedBuilder()
            .setTitle(`🎰 Table ${tableId} - ${gameType.toUpperCase()}`)
            .setDescription(`**Host**: ${interaction.user.username}\n**Status**: Waiting for players\n\n**Players Joined**:\n- ${interaction.user.username}`)
            .setColor('#2ecc71');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('join_table').setLabel('Join').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('leave_table').setLabel('Leave Table').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('start_game').setLabel('Start Game').setStyle(ButtonStyle.Primary)
            );

        const msg = await thread.send({ embeds: [embed], components: [row] });
        table.messageId = msg.id;

        await interaction.editReply({ content: `✅ Table created! Join here: <#${thread.id}>` });
        await lobbyManager.updateLobby(interaction.client);
    } catch (error) {
        console.error('Error creating thread:', error);
        await interaction.editReply({ content: '❌ Failed to create table. Please check permissions.' });
    }
}

async function handleJoinFromMenu(interaction) {
    const threadId = interaction.values[0];
    const table = tableManager.getTable(threadId);

    if (!table) {
        return interaction.reply({ content: '❌ That table no longer exists.', ephemeral: true });
    }

    if (tableManager.getUserTable(interaction.user.id)) {
        return interaction.reply({ content: '❌ You are already at a table.', ephemeral: true });
    }

    if (table.status !== 'lobby') {
        return interaction.reply({ content: '❌ You cannot join a game in progress.', ephemeral: true });
    }

    try {
        const channel = await interaction.client.channels.fetch(threadId);
        await channel.members.add(interaction.user.id);
        await interaction.reply({ content: `✅ Added you to the table! Go to <#${threadId}> and click the **Join** button to enter the active player roster.`, ephemeral: true });
    } catch(err) {
        console.error(err);
        await interaction.reply({ content: `❌ Failed to access table.`, ephemeral: true });
    }
}

module.exports = { handleButton };