const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadCommands } = require('./utils/commandLoader');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

client.once('ready', async () => {
    console.log(`🟢 Logged in as ${client.user.tag}`);
    await loadCommands(client);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) {
            await command.execute(interaction);
        }
    }
    else if (interaction.isButton()) {
        const { handleButton } = require('./utils/buttonHandlers');
        await handleButton(interaction);
    }
});


client.login(process.env.DISCORD_TOKEN);
