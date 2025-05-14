/**
 * Utility to extract common user context
 * @param {import('discord.js').Interaction} interaction 
 */
function getContext(interaction) {
    const user = interaction.user;
    const member = interaction.member;

    return {
        user,
        displayName: member?.nickname || user.username
    };
}

module.exports = { getContext };
