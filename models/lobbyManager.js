const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const tableManager = require('./tableManager');

class LobbyManager {
    constructor() {
        this.lobbyChannel = null;
        this.welcomeMessageId = null;
        this.tableMessageIds = new Map(); // Map<baseTableName, messageId>
        // For debouncing if you implement it
        // this.refreshTimeout = null;
        // this.isRefreshing = false;
    }

    async setLobbyChannel(channel) {
        console.log(`[LOBBY_DEBUG] Setting lobby channel to: ${channel ? channel.id + ' (' + channel.name + ')' : 'null'}`);
        this.lobbyChannel = channel;
        this.welcomeMessageId = null; // Reset on new channel
        this.tableMessageIds.clear(); // Reset on new channel
    }

    // If you use debouncing, this would be requestRefresh, and the main logic below would be _actualRefreshLobby
    async refreshLobby(client) {
        console.log(`[LOBBY_DEBUG] refreshLobby called. Lobby channel ID: ${this.lobbyChannel ? this.lobbyChannel.id : 'Not set'}`);
        if (!this.lobbyChannel) {
            console.warn('[LOBBY_DEBUG] Lobby channel not set. Cannot refresh lobby.');
            return;
        }
        if (!client || !client.user) { // Added check for client itself
            console.warn('[LOBBY_DEBUG] Client or client.user not available. Cannot refresh lobby.');
            return;
        }

        console.log(`[LOBBY_DEBUG] Starting refresh process for channel ${this.lobbyChannel.name} (${this.lobbyChannel.id}).`);

        try {
            const currentTables = tableManager.getAllTables();
            console.log(`[LOBBY_DEBUG] Fetched ${currentTables.length} tables from tableManager.`);
            currentTables.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // Oldest first for processing order

            const newTableMessageIds = new Map();
            let newWelcomeMessageId = null;
            const messagesToKeep = new Set();

            console.log(`[LOBBY_DEBUG] Current tracked table messages: ${this.tableMessageIds.size}, Welcome message ID: ${this.welcomeMessageId}`);

            // --- Manage Table Listing Messages ---
            if (currentTables.length > 0) {
                console.log('[LOBBY_DEBUG] Processing table listing messages...');
            } else {
                console.log('[LOBBY_DEBUG] No active tables to list.');
            }

            for (const table of currentTables) {
                console.log(`[LOBBY_DEBUG] Processing table: ${table.name} (DisplayName: ${table.displayName}, Wager: ${table.wager}, Players: ${table.players.length})`);
                const playerList = table.players.map(p => p.displayName || p.user.username).join('\n') || '*No players yet*';
                const embed = new EmbedBuilder()
                    .setTitle(`🎲 ${table.displayName || table.name}`)
                    .setDescription(`Wager: **${(table.wager !== undefined && table.wager !== null ? table.wager : 0).toLocaleString()} gold**\n\n👥 **Players (${table.players.length}):**\n${playerList}`) // Added check for wager
                    .setColor(0x00AE86)
                    .setTimestamp(table.createdAt || Date.now())
                    .setFooter({ text: `Table ID: ${table.name}` });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`join-${table.name}`)
                        .setLabel('🎟️ Join Table')
                        .setStyle(ButtonStyle.Success)
                );
                if (table.channelId) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setLabel('↪️ Go to Table')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${this.lobbyChannel.guild.id}/${table.channelId}`)
                    );
                }

                const messageContent = { embeds: [embed], components: [row] };
                const existingMessageId = this.tableMessageIds.get(table.name);
                console.log(`[LOBBY_DEBUG] Table ${table.name} - Existing message ID from map: ${existingMessageId}`);

                if (existingMessageId) {
                    try {
                        const message = await this.lobbyChannel.messages.fetch(existingMessageId);
                        console.log(`[LOBBY_DEBUG] Table ${table.name} - Fetched existing message ${message.id}. Author: ${message.author.id}, Bot ID: ${client.user.id}`);
                        if (message.author.id === client.user.id) {
                            console.log(`[LOBBY_DEBUG] Table ${table.name} - Editing existing message ${message.id}.`);
                            await message.edit(messageContent);
                            newTableMessageIds.set(table.name, message.id);
                            messagesToKeep.add(message.id);
                        } else {
                            console.warn(`[LOBBY_DEBUG] Table ${table.name} - Message ${existingMessageId} not authored by bot. Sending new message.`);
                            const newMessage = await this.lobbyChannel.send(messageContent);
                            console.log(`[LOBBY_DEBUG] Table ${table.name} - Sent new message ${newMessage.id} (author mismatch).`);
                            newTableMessageIds.set(table.name, newMessage.id);
                            messagesToKeep.add(newMessage.id);
                        }
                    } catch (error) {
                        console.warn(`[LOBBY_DEBUG] Table ${table.name} - Error fetching/editing message ${existingMessageId} (Code: ${error.code}). Sending new one. Error: ${error.message}`);
                        const newMessage = await this.lobbyChannel.send(messageContent);
                        console.log(`[LOBBY_DEBUG] Table ${table.name} - Sent new message ${newMessage.id} (fetch/edit error).`);
                        newTableMessageIds.set(table.name, newMessage.id);
                        messagesToKeep.add(newMessage.id);
                    }
                } else {
                    console.log(`[LOBBY_DEBUG] Table ${table.name} - No existing message ID found. Sending new message.`);
                    const newMessage = await this.lobbyChannel.send(messageContent);
                    console.log(`[LOBBY_DEBUG] Table ${table.name} - Sent new message ${newMessage.id}.`);
                    newTableMessageIds.set(table.name, newMessage.id);
                    messagesToKeep.add(newMessage.id);
                }
            }

            // --- Manage Welcome/Create Message ---
            console.log('[LOBBY_DEBUG] Processing welcome message...');
            const welcomeEmbed = new EmbedBuilder() // ... (rest of welcome embed)
                .setTitle('🎉 Welcome to The House Casino!')
                .setDescription('All tables are listed above.\nClick below to create a new table and start playing!')
                .setColor(0xFFD700);
            const welcomeRow = new ActionRowBuilder().addComponents( /* ... create button ... */
                new ButtonBuilder().setCustomId('create').setLabel('✨ Create New Table').setStyle(ButtonStyle.Primary)
            );
            const welcomeMessageContent = { embeds: [welcomeEmbed], components: [welcomeRow] };

            if (this.welcomeMessageId) {
                console.log(`[LOBBY_DEBUG] Welcome - Existing message ID from map: ${this.welcomeMessageId}`);
                try {
                    const message = await this.lobbyChannel.messages.fetch(this.welcomeMessageId);
                    console.log(`[LOBBY_DEBUG] Welcome - Fetched existing message ${message.id}. Author: ${message.author.id}`);
                    if (message.author.id === client.user.id) {
                        console.log(`[LOBBY_DEBUG] Welcome - Editing existing message ${message.id}.`);
                        await message.edit(welcomeMessageContent);
                        newWelcomeMessageId = message.id;
                        messagesToKeep.add(message.id);
                    } else {
                        console.warn(`[LOBBY_DEBUG] Welcome - Message ${this.welcomeMessageId} not authored by bot. Sending new message.`);
                        const newMessage = await this.lobbyChannel.send(welcomeMessageContent);
                        newWelcomeMessageId = newMessage.id;
                        messagesToKeep.add(newMessage.id);
                    }
                } catch (error) {
                    console.warn(`[LOBBY_DEBUG] Welcome - Error fetching/editing message ${this.welcomeMessageId} (Code: ${error.code}). Sending new one. Error: ${error.message}`);
                    const newMessage = await this.lobbyChannel.send(welcomeMessageContent);
                    newWelcomeMessageId = newMessage.id;
                    messagesToKeep.add(newMessage.id);
                }
            } else {
                console.log(`[LOBBY_DEBUG] Welcome - No existing message ID. Sending new message.`);
                const newMessage = await this.lobbyChannel.send(welcomeMessageContent);
                newWelcomeMessageId = newMessage.id;
                messagesToKeep.add(newMessage.id);
            }

            // --- Cleanup Old Bot Messages ---
            console.log('[LOBBY_DEBUG] Starting cleanup of old bot messages...');
            const recentMessages = await this.lobbyChannel.messages.fetch({ limit: 50 });
            const messagesToDeletePromises = [];

            console.log(`[LOBBY_DEBUG] Fetched ${recentMessages.size} recent messages for cleanup. Messages to keep: ${messagesToKeep.size}`);
            recentMessages.forEach(msg => {
                if (msg.author.id === client.user.id && !messagesToKeep.has(msg.id)) {
                    console.log(`[LOBBY_DEBUG] Scheduling old bot message ${msg.id} for deletion.`);
                    messagesToDeletePromises.push(msg.delete().catch(err => {
                        if (err.code !== 10008) {
                            console.error(`[LOBBY_DEBUG] Failed to delete old bot message ${msg.id} (Code: ${err.code}):`, err.message);
                        } else {
                            console.log(`[LOBBY_DEBUG] Old bot message ${msg.id} already deleted (Unknown Message).`);
                        }
                    }));
                }
            });
            await Promise.all(messagesToDeletePromises);
            console.log(`[LOBBY_DEBUG] Finished cleanup. Deleted ${messagesToDeletePromises.length} old messages.`);

            this.tableMessageIds = newTableMessageIds;
            this.welcomeMessageId = newWelcomeMessageId;
            console.log(`[LOBBY_DEBUG] Updated internal tracking. Table messages: ${this.tableMessageIds.size}, Welcome message ID: ${this.welcomeMessageId}`);

        } catch (error) {
            console.error('[LOBBY_DEBUG] Critical error during refreshLobby:', error);
            if (this.lobbyChannel) {
                try {
                    if (!(error instanceof TypeError && error.message.includes("Cannot read properties of null (reading 'send')"))) {
                        await this.lobbyChannel.send('⚠️ An error occurred while updating the lobby. Some information may be outdated.').catch(e => console.error("[LOBBY_DEBUG] Failed to send error message to lobby channel:", e));
                    }
                } catch (e) {  }
            }
        }
        console.log('[LOBBY_DEBUG] refreshLobby finished.');
    }
}

module.exports = new LobbyManager();