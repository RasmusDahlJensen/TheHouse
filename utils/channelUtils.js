const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { createRole } = require('./roleUtils');

const CATEGORY_ID = '1371858395648491654';

/**
 * @param {import('discord.js').Guild} guild 
 * @param {string} tableName 
 */
async function createTableChannelAndRole(guild, tableName) {
    const role = await createRole(guild, tableName);

    const channel = await guild.channels.create({
        name: tableName,
        type: ChannelType.GuildText,
        parent: CATEGORY_ID,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
            }
        ]
    });

    return { channel, role };
}

module.exports = { createTableChannelAndRole };
