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
    console.log('Registering commands:');
    commands.forEach(cmd => console.log(`- /${cmd.name}`));


    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('✅ Slash commands registered.');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
}

module.exports = { loadCommands };
