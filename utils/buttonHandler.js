const tableManager = require('../models/tableManager');
const lobbyManager = require('../models/lobbyManager');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const games = require('../data/games');


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

        // Check if role already exists
        let role = interaction.guild.roles.cache.find(r => r.name === tableName);

        if (!role) {
            // Create role if missing
            role = await interaction.guild.roles.create({
                name: tableName,
                color: 'Random',
                reason: 'Table access role',
            });
        }

        // Assign role to user
        await interaction.member.roles.add(role);

        // Create channel
        const newChannel = await interaction.guild.channels.create({
            name: tableName.toLowerCase().replace(/\s+/g, '-'),
            type: 0,
            parent: categoryId,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: ['ViewChannel'],
                },
                {
                    id: role.id,
                    allow: ['ViewChannel'],
                }
            ],
        });

        // Create table object
        const newTable = tableManager.createTable({
            name: tableName,
            channelId: newChannel.id,
            roleId: role.id,
            hostUserId: user.id,
            wager: 5000
        });

        // Link user to table
        tableManager.registerUserToTable(user.id, newTable.name);
        newTable.addPlayer(user);

        // Fetch the new channel
        const tableChannel = await interaction.guild.channels.fetch(newChannel.id);

        // Build embed message
        const gameList = games.map(g => `• **${g.name}** – ${g.description}`).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`🎰 Welcome to ${tableName}`)
            .setDescription(`**Choose a game to begin:**\n${gameList}`)
            .setFooter({ text: 'Click a game button below to start!' })
            .setColor(0xFFD700);

        // Game buttons row
        const gameButtons = new ActionRowBuilder();
        games.forEach(game => {
            gameButtons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`game-${game.id}-${newTable.name}`)
                    .setLabel(game.name)
                    .setStyle(ButtonStyle.Primary)
            );
        });

        // Leave table button row
        const leaveButtonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`leave-${newTable.name}`)
                .setLabel('🏃 Leave Table')
                .setStyle(ButtonStyle.Danger)
        );

        // Send the initial message into the table channel
        await tableChannel.send({
            embeds: [embed],
            components: [gameButtons, leaveButtonRow]
        });

        await lobbyManager.refreshLobby(interaction.client);

        return interaction.reply({
            content: `✅ Created new table: **${newTable.name}** (Channel: <#${newChannel.id}>)`,
            ephemeral: true
        });
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

    if (action === 'leave') {
        const table = tableManager.getTableByUser(user.id);
        if (!table) {
            return interaction.reply({ content: '❌ You are not in any table.', ephemeral: true });
        }

        const member = interaction.member;
        const userId = user.id;

        const wasInTable = table.players.some(p => p.user.id === userId);
        if (!wasInTable) {
            return interaction.reply({ content: '❌ You are not in this table.', ephemeral: true });
        }

        table.removePlayer(userId);
        tableManager.unregisterUser(userId);

        const role = interaction.guild.roles.cache.get(table.roleId);
        if (role && member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
        }

        if (table.isEmpty()) {
            const channel = await interaction.client.channels.fetch(table.channelId);
            await channel.delete();
            if (role) await role.delete();
            tableManager.deleteTable(table.name);
            return;
        }

        await interaction.reply({ content: `👋 You left **${table.name}**.`, ephemeral: true });
    }


}

module.exports = { handleButton };
