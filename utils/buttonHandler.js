/**
 * Handle button interactions
 * @param {import('discord.js').ButtonInteraction} interaction 
 */
async function handleButton(interaction) {
    await interaction.reply({ content: 'Button clicked! (no real handler yet)', ephemeral: true });
}

module.exports = { handleButton };
