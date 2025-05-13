const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createTableChannelAndRole } = require('../utils/channelUtils');
const tableManager = require('../models/TableManager');
const { getContext } = require('../utils/context');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('starttable')
        .setDescription('Start a new game table')
        .addIntegerOption(option =>
            option.setName('wager')
                .setDescription('Wager amount (defaults to 5000)')
                .setRequired(false)
        ),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const { user, displayName } = getContext(interaction);

        if (tableManager.getTableByUser(user.id)) {
            return interaction.reply({ content: '❌ You are already in a table. Leave it before starting a new one.', ephemeral: true });
        }

        const wager = interaction.options.getInteger('wager') || 5000;

        const tableId = tableManager.getNextTableId();
        const tableName = `table-${tableId}`;

        const { channel, role } = await createTableChannelAndRole(interaction.guild, tableName);

        const table = tableManager.createTable({
            name: tableName,
            channelId: channel.id,
            roleId: role.id,
            hostUserId: user.id,
            wager
        });

        table.addPlayer(user);
        await interaction.member.roles.add(role);

        await interaction.reply({ content: `✅ Table **${table.name}** created! Check out <#${channel.id}>`, ephemeral: true });
    }
};
