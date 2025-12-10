const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

/**
 * Loads all slash commands and registers them with Discord API
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
    const guildId = process.env.GUILD_ID;

    console.log('Registering commands:');
    commands.forEach(cmd => console.log(`- /${cmd.name}`));

    try {
        if (guildId) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
            console.log('ƒo. Slash commands registered to guild:', guildId);
        } else {
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
            console.log('ƒo. Slash commands registered globally (may take up to an hour to propagate).');
        }
    } catch (error) {
        console.error('ƒ?O Error registering commands:', error);
    }
}

module.exports = { loadCommands };
