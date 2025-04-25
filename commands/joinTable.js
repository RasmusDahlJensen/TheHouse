const { SlashCommandBuilder } = require('discord.js');
const { getContext } = require('../utils/context');
const tableManager = require('../models/TableManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jointable')
        .setDescription('Join an existing table by name')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the table to join (e.g. Table 1)')
                .setRequired(true)
        ),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const { user, displayName } = getContext(interaction);

        if (tableManager.getTableByUser(user.id)) {
            return interaction.reply({ content: 'You are already in a table. Leave it before joining another.', ephemeral: true });
        }

        const name = interaction.options.getString('name');
        const table = tableManager.getTableByName(name);

        if (!table) {
            return interaction.reply({ content: `Table **${name}** does not exist.`, ephemeral: true });
        }

        const joined = table.addPlayer(user);
        if (!joined) {
            return interaction.reply({ content: 'You are already in that table.', ephemeral: true });
        }

        tableManager.registerUserToTable(user.id, name);

        await interaction.reply(`✅ **${displayName}** joined **${name}**.\nCurrent players:\n${table.getDisplayList()}`);
    }
};
