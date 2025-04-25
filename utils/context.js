/**
 * Extracts clean user-related context from a command interaction
 * @param {import('discord.js').ChatInputCommandInteraction} interaction 
 */
function getContext(interaction) {
    return {
        user: interaction.user,
        displayName: interaction.member.displayName,
        member: interaction.member,
        guild: interaction.guild
    };
}

module.exports = { getContext };
