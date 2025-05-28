const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { createRole } = require('./roleUtils');

/**
 * Creates a new text channel and associated role for a game table.
 * @param {import('discord.js').Guild} guild
 * @param {string} baseTableName - The base name for the table, e.g., "table-1".
 */
async function createTableChannelAndRole(guild, baseTableName) {
    const role = await createRole(guild, baseTableName);

    const channelName = baseTableName.toLowerCase();

    const categoryId = process.env.TABLE_CATEGORY_ID;
    if (!categoryId) {
        console.error('TABLE_CATEGORY_ID is not set in .env file. Table channel will be created without a category.');
        throw new Error('TABLE_CATEGORY_ID is not set in .env file.');
    }

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoryId || null,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
        ],
        reason: `Game table channel for ${baseTableName}`,
    });

    return { channel, role };
}

module.exports = { createTableChannelAndRole };