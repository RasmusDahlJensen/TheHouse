const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const tableManager = require('../models/TableManager');

/**
 * Handles button interactions (Join, Leave, Ready)
 * @param {import('discord.js').ButtonInteraction} interaction 
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    if (!customId.includes('-')) return;

    const [action, tableName] = customId.split('-');
    const table = tableManager.getTableByName(tableName);

    if (!table) {
        return interaction.reply({ content: '❌ This table no longer exists.', ephemeral: true });
    }

    const user = interaction.user;
    const alreadyInTable = table.players.some(p => p.user.id === user.id);

    // Handle actions
    if (action === 'join') {
        if (alreadyInTable) {
            return interaction.reply({ content: '❌ You are already in this table.', ephemeral: true });
        }
        table.addPlayer(user);
        tableManager.registerUserToTable(user.id, table.name);
        await updateTableMessage(interaction, table);
        await interaction.reply({ content: `✅ You joined **${table.name}**!`, ephemeral: true });
    }
    else if (action === 'leave') {
        if (!alreadyInTable) {
            return interaction.reply({ content: '❌ You are not in this table.', ephemeral: true });
        }
        table.removePlayer(user.id);
        tableManager.unregisterUser(user.id);
        await updateTableMessage(interaction, table);
        await interaction.reply({ content: `👋 You left **${table.name}**.`, ephemeral: true });

        // If table empty, delete it
        if (table.isEmpty()) {
            const channel = await interaction.client.channels.fetch(table.channelId);
            const message = await channel.messages.fetch(table.messageId);
            await message.delete();
            tableManager.deleteTable(table.name);
        }
    }
    else if (action === 'ready') {
        if (!alreadyInTable) {
            return interaction.reply({ content: '❌ You must join the table first.', ephemeral: true });
        }
        if (!table.readyPlayers) {
            table.readyPlayers = new Set();
        }
        table.readyPlayers.add(user.id);
        await updateTableMessage(interaction, table);
        await interaction.reply({ content: `✅ You are now ready!`, ephemeral: true });
    }
}

/**
 * Updates the table message embed
 * @param {import('discord.js').ButtonInteraction} interaction 
 * @param {import('../models/Table')} table 
 */
async function updateTableMessage(interaction, table) {
    const channel = await interaction.client.channels.fetch(table.channelId);
    const message = await channel.messages.fetch(table.messageId);

    const playersList = table.players.length > 0
        ? table.players.map(p => {
            const isReady = table.readyPlayers?.has(p.user.id);
            const isHost = p.user.id === table.hostUserId;
            return `${isReady ? '✅' : '🔸'} ${p.user.username}${isHost ? ' 👑 (host)' : ''}`;
        }).join('\n')
        : '*No players yet*';

    const embed = new EmbedBuilder()
        .setTitle(`🎲 ${table.name}`)
        .setDescription(`Wager: **${table.wager.toLocaleString()} gold**\n\n${playersList}`)
        .setColor(0x00AE86)
        .setFooter({ text: `Host: ${table.players[0]?.user.username || 'None'}` });

    const buttons = new ActionRowBuilder();
    const alreadyInTable = table.players.some(p => p.user.id === interaction.user.id);

    if (!alreadyInTable) {
        buttons.addComponents(
            new ButtonBuilder()
                .setCustomId(`join-${table.name}`)
                .setLabel('🎟️ Join Table')
                .setStyle(ButtonStyle.Success)
        );
    } else {
        buttons.addComponents(
            new ButtonBuilder()
                .setCustomId(`leave-${table.name}`)
                .setLabel('🏃 Leave Table')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`ready-${table.name}`)
                .setLabel('✅ Ready Up')
                .setStyle(ButtonStyle.Primary)
        );
    }

    await message.edit({ embeds: [embed], components: [buttons] });
}


module.exports = { handleButton };
