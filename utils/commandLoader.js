const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

/**
 * Loads and registers all slash commands
 * @param {import('discord.js').Client} client 
 */
async function loadCommands(client) {
    const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
    const commands = [];

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    const clientId = process.env.CLIENT_ID;
    const guildIdsRaw = process.env.GUILD_IDS;

    try {
        if (guildIdsRaw) {
            const guildIds = guildIdsRaw.split(',').map(id => id.trim());

            for (const guildId of guildIds) {
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                );
                console.log(`✅ Registered commands for guild ${guildId}`);
            }
        } else {
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
            console.log('✅ Registered GLOBAL commands');
        }
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
}

module.exports = { loadCommands };
