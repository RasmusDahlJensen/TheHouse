const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();
const { loadCommands } = require('./utils/commandLoader');
const { handleButton } = require('./utils/buttonHandler');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Load commands dynamically
client.commands = new Collection();

client.once('ready', async () => {
    console.log(`🟢 Logged in as ${client.user.tag}`);
    await loadCommands(client);
});

// Slash Command and Button Interactions
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }
    if (interaction.isButton()) {
        await handleButton(interaction);
    }
});

client.login(process.env.DISCORD_TOKEN);
