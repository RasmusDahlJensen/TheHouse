/**
 * Create a role for a new table
 * @param {import('discord.js').Guild} guild 
 * @param {string} tableName 
 */
async function createRole(guild, tableName) {
    const role = await guild.roles.create({
        name: `${tableName}-players`,
        mentionable: false,
        color: 0x00AE86
    });

    return role;
}

module.exports = { createRole };
