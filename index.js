const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

let queue = [];
let currentWager = null;
let leaderboard = {};

const commands = [
    new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Queue up to battle someone!')
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('Wager amount (e.g. 60k)')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('cancelroll')
        .setDescription('Cancel your roll queue entry'),
    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the win leaderboard!')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

client.once('ready', () => {
    console.log(`🟢 Logged in as ${client.user.tag}`);
    (async () => {
        try {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
            console.log('✅ Slash commands registered.');
        } catch (error) {
            console.error(error);
        }
    })();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const user = interaction.user;

    if (interaction.commandName === 'roll') {
        const existing = queue.find(u => u.id === user.id);
        if (existing) {
            await interaction.reply({ content: 'You’re already in the queue!', ephemeral: true });
            return;
        }

        // if(wager){
        //     await interaction.reply({ content: `Wager has already been chosen, its ${wager}`, ephemeral: true})
        // }

        const wager = interaction.options.getString('amount');

        if (queue.length === 0) {
            if (!wager) {
                await interaction.reply({ content: 'You must specify an amount for the first roll (e.g. /roll 60k)', ephemeral: true });
                return;
            }

            queue.push(user);
            currentWager = wager;
            await interaction.reply(`${user.username} has started a battle with a **${wager}** pot! Waiting for another player...`);
            return;
        }

        if (queue.length === 1) {
            queue.push(user);
            const [player1, player2] = queue.splice(0, 2);
            const roll1 = Math.ceil(Math.random() * 100);
            const roll2 = Math.ceil(Math.random() * 100);

            let resultMessage = `🎲 **Roll Results for ${currentWager}**\n${player1.username} rolled **${roll1}**\n${player2.username} rolled **${roll2}**\n 🎲`;

            if (roll1 === roll2) {
                resultMessage += `It's a tie! 🤝`;
            } else {
                const winner = roll1 > roll2 ? player1 : player2;
                leaderboard[winner.id] = leaderboard[winner.id] || { name: winner.username, wins: 0 };
                leaderboard[winner.id].wins += 1;

                resultMessage += `🎉 **${winner.username} wins the ${currentWager} pot!** 🎉`;
            }

            currentWager = null;
            await interaction.reply(resultMessage);
            return;
        }

        await interaction.reply({ content: 'There’s already a match in progress. Try again in a moment.', ephemeral: true });

    } else if (interaction.commandName === 'cancelroll') {
        const index = queue.findIndex(u => u.id === user.id);

        if (index === -1) {
            await interaction.reply({ content: 'You are not in the queue.', ephemeral: true });
        } else {
            queue.splice(index, 1);
            if (queue.length === 0) currentWager = null;
            await interaction.reply(`${user.username} has left the roll queue.`);
        }

    } else if (interaction.commandName === 'leaderboard') {
        if (Object.keys(leaderboard).length === 0) {
            await interaction.reply('Leaderboard is empty!');
            return;
        }

        const sorted = Object.values(leaderboard).sort((a, b) => b.wins - a.wins);
        const board = sorted.map((entry, idx) => `${idx + 1}. **${entry.name}** – ${entry.wins} win(s)`).join('\n');

        await interaction.reply(`🏆 **Leaderboard**\n${board}`);
    }
});

client.login(token);
