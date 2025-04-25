const { SlashCommandBuilder } = require('discord.js');
const tableManager = require('../models/TableManager');

const botNames = [
    'Dealer Dave',
    'Vegas Steve',
    'Highroller Hank',
    'Greedy Gerald',
];

function getRandomBotName(usedNames) {
    const available = botNames.filter(name => !usedNames.includes(name));
    return available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : `AI Bot ${Math.floor(Math.random() * 9999)}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addbot')
        .setDescription('Add a debug AI bot to your current table (host only)'),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const { user, displayName } = require('../utils/context').getContext(interaction);

        const table = tableManager.getTableByUser(user.id);

        if (!table) {
            return interaction.reply({ content: 'You are not in a table.', ephemeral: true });
        }

        if (table.hostUserId !== user.id) {
            return interaction.reply({ content: 'Only the table host can add bots.', ephemeral: true });
        }

        const usedBotNames = table.players.filter(p => p.isBot).map(p => p.user.username);
        const botName = getRandomBotName(usedBotNames);

        const fakeUser = {
            id: `BOT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            username: botName,
            bot: true,
            tag: `${botName.replace(/\s+/g, '')}#9999`,
        };

        table.addPlayer(fakeUser, true);

        await interaction.reply(`🤖 **${botName}** has joined **${table.name}**.`);
    }
};
