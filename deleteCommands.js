const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started deleting all global application commands.');

        // Fetch all global commands
        const commands = await rest.get(
            Routes.applicationCommands(process.env.CLIENT_ID)
        );

        console.log(`Found ${commands.length} global commands to delete.`);

        for (const command of commands) {
            await rest.delete(
                Routes.applicationCommand(process.env.CLIENT_ID, command.id)
            );
            console.log(`Deleted global command: ${command.name}`);
        }

        console.log('Successfully deleted all global commands.');
        
        if (process.env.GUILD_ID) {
           console.log('Now checking for guild specific commands to delete...');
           const guildCommands = await rest.get(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
            );
            console.log(`Found ${guildCommands.length} guild commands to delete.`);

            for (const command of guildCommands) {
                await rest.delete(
                    Routes.applicationGuildCommand(process.env.CLIENT_ID, process.env.GUILD_ID, command.id)
                );
                console.log(`Deleted guild command: ${command.name}`);
            }
            console.log('Successfully deleted all guild commands.');
        }

    } catch (error) {
        console.error(error);
    }
})();
