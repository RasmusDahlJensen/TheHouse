const { SlashCommandBuilder } = require('discord.js');
const { createTableChannelAndRole } = require('../utils/channelUtils');
const tableManager = require('../models/tableManager');
const { getContext } = require('../utils/context');
const lobbyManager = require('../models/lobbyManager');
const gameManager = require('../utils/gameManager');

module.exports = {
    // ... (data property) ...
    async execute(interaction) {
        const { user, displayName } = getContext(interaction);

        if (tableManager.getTableByUser(user.id)) {
            return interaction.reply({ content: '❌ You are already in a table...', ephemeral: true });
        }

        const wager = interaction.options.getInteger('wager') || 5000;
        const tableNumericId = tableManager.getNextTableId();
        const baseTableName = `table-${tableNumericId}`;
        const displayTableName = `Table ${tableNumericId}`;

        try {
            const { channel, role } = await createTableChannelAndRole(interaction.guild, baseTableName);

            const newTable = tableManager.createTable({
                name: baseTableName,
                displayName: displayTableName,
                channelId: channel.id,
                roleId: role.id,
                hostUserId: user.id,
                wager: wager,
            });

            newTable.addPlayer(user, displayName);
            tableManager.registerUserToTable(user.id, newTable.name);
            await interaction.member.roles.add(role);

            // Send the initial message using GameManager
            const initialEmbed = gameManager.buildTableEmbed(newTable);
            const initialComponents = gameManager.buildTableComponents(newTable);
            const gameMessage = await channel.send({ embeds: [initialEmbed], components: initialComponents });
            newTable.setMessageId(gameMessage.id);

            await lobbyManager.refreshLobby(interaction.client);

            await interaction.reply({ content: `✅ Table **${newTable.displayName}** created! Check out <#${channel.id}>`, ephemeral: true });

        } catch (error) {
        }
    }
};