/**
 * Create or retrieve a role for a new table.
 * @param {import('discord.js').Guild} guild
 * @param {string} baseTableName
 */
async function createRole(guild, baseTableName) {
    const roleName = `${baseTableName}-role`;

    let role = guild.roles.cache.find(r => r.name === roleName);
    if (role) {
        return role;
    }

    role = await guild.roles.create({
        name: roleName,
        mentionable: false,
        color: 0x00AE86,
        reason: `Access role for ${baseTableName}`,
    });

    return role;
}

module.exports = { createRole };