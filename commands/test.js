const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('🧪 Temporary test command'),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.reply({
            content: '✅ Test successful! Your bot is alive and working.',
            ephemeral: true
        });
    }
};
