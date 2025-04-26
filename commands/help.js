const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const commands = interaction.client.commands;

        const helpText = `
🎲 **The House - Available Commands**

${Array.from(commands.values())
                .map(cmd => `**/${cmd.data.name}** — ${cmd.data.description}`)
                .join('\n')}

🔹 You can only be in one table at a time.
🔹 You must be at a table to roll.
🔹 Host-only actions are restricted to the player who started the table.

`;

        await interaction.reply({ content: helpText, ephemeral: true });
    }
};
