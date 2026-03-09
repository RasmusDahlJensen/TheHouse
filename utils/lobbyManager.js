const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const tableManager = require('./tableManager'); // Circular dependency handled by lazy require inside functions if needed, but safe here since tableManager doesn't require lobbyManager on module load

let lobbyChannelId = null;
let lobbyMessageId = null;

async function updateLobby(client) {
    if (!lobbyChannelId) return;

    try {
        const channel = await client.channels.fetch(lobbyChannelId);
        if (!channel || !channel.isTextBased()) return;

        const tables = tableManager.getAllTables();
        const activeTablesCount = tables.size;

        const embed = new EmbedBuilder()
            .setTitle('🎲 The House - Casino Lobby')
            .setDescription('Welcome to the Casino! Create a new table or join an existing one from the menu below.')
            .setColor('#f1c40f')
            .addFields(
                { name: 'Active Tables', value: activeTablesCount.toString(), inline: true }
            );

        if (activeTablesCount > 0) {
            let tableList = '';
            tables.forEach(table => {
                const hostName = table.players.find(p => p.id === table.hostId)?.username || 'Unknown';
                tableList += `**Table ${tableManager.getTableNumericId(table.threadId)}** (${table.gameType.toUpperCase()}) - Host: ${hostName} - Players: ${table.players.length}\n`;
            });
            embed.addFields({ name: 'Current Games', value: tableList });
        } else {
            embed.addFields({ name: 'Current Games', value: 'No active tables. Why not create one?' });
        }

        const buttonsRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_table_roll')
                    .setLabel('Create /roll Table')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('create_table_deathroll')
                    .setLabel('Create Deathroll Table')
                    .setStyle(ButtonStyle.Danger)
            );

        const components = [buttonsRow];

        if (activeTablesCount > 0) {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('join_table_menu')
                .setPlaceholder('Select a table to join...');

            // Discord limits select menus to 25 options. We'll just take the top 25 for now.
            let optionsCount = 0;
            tables.forEach((table, threadId) => {
                if (optionsCount >= 25) return;
                const hostName = table.players.find(p => p.id === table.hostId)?.username || 'Unknown';
                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Table ${tableManager.getTableNumericId(threadId)} (${table.gameType.toUpperCase()})`)
                        .setDescription(`Host: ${hostName} | Players: ${table.players.length}`)
                        .setValue(threadId)
                );
                optionsCount++;
            });

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);
            components.push(selectRow);
        }

        if (lobbyMessageId) {
            try {
                const msg = await channel.messages.fetch(lobbyMessageId);
                await msg.edit({ embeds: [embed], components: components });
            } catch (err) {
                // If message is deleted, send a new one
                const newMsg = await channel.send({ embeds: [embed], components: components });
                lobbyMessageId = newMsg.id;
            }
        } else {
            const newMsg = await channel.send({ embeds: [embed], components: components });
            lobbyMessageId = newMsg.id;
        }

    } catch (e) {
        console.error("Failed to update lobby:", e);
    }
}

module.exports = {
    setLobbyChannel: (channelId) => {
        lobbyChannelId = channelId;
    },
    getLobbyChannel: () => lobbyChannelId,
    updateLobby
};
