const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

/**
 * Loads all slash commands and registers them
 */
async function loadCommands(client) {
    const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
    const commands = [];

    console.log('📦 Registering commands:');

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`- /${command.data.name}`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        if (process.env.GUILD_ID) {
            console.log('🌐 Registering commands to guild (fast)...');
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
        } else {
            console.log('🌍 Registering commands globally (slow)...');
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
        }
        console.log('✅ Slash commands registered.');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
}

module.exports = { loadCommands };
