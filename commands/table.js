const { SlashCommandBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const tableManager = require('../utils/tableManager');
const lobbyManager = require('../utils/lobbyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('table')
        .setDescription('Creates a new casino table')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('The game you want to play')
                .setRequired(true)
                .addChoices(
                    { name: 'Roll (1-100)', value: 'roll' },
                    { name: 'Deathroll', value: 'deathroll' }
                )
        ),
    async execute(interaction) {
        // We only allow creating tables in guild text channels
        if (interaction.channel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: '❌ Tables can only be created in standard text channels.', ephemeral: true });
        }

        const gameType = interaction.options.getString('game');
        
        // Ensure user isn't already active in a table
        if (tableManager.getUserTable(interaction.user.id)) {
            return interaction.reply({ content: '❌ You are already at a table! Please leave it first before creating a new one.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const tableId = tableManager.generateTableId();
            const threadName = `Table ${tableId} - ${gameType.toUpperCase()}`;
            
            // Create Private Thread
            const thread = await interaction.channel.threads.create({
                name: threadName,
                autoArchiveDuration: 60,
                type: ChannelType.PrivateThread,
                reason: `Casino table requested by ${interaction.user.tag}`
            });

            // Add the creator
            await thread.members.add(interaction.user.id);

            // Register the table in memory
            const table = tableManager.createTable(thread.id, tableId, gameType, interaction.user);

            // Create initial lobby embed and buttons
            const embed = new EmbedBuilder()
                .setTitle(`🎰 Table ${tableId} - ${gameType.toUpperCase()}`)
                .setDescription(`**Host**: ${interaction.user.username}\n**Status**: Waiting for players\n\n**Players Joined**:\n- ${interaction.user.username}`)
                .setColor('#2ecc71');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('join_table')
                        .setLabel('Join')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('leave_table')
                        .setLabel('Leave Table')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('start_game')
                        .setLabel('Start Game')
                        .setStyle(ButtonStyle.Primary)
                );

            const msg = await thread.send({ embeds: [embed], components: [row] });
            table.messageId = msg.id;

            await interaction.editReply({ content: `✅ Table created! Join here: <#${thread.id}>` });
            
            // Sync with Lobby
            await lobbyManager.updateLobby(interaction.client);
        } catch (error) {
            console.error('Error creating thread:', error);
            await interaction.editReply({ content: '❌ Failed to create table. Please check my permissions. Ensure I have the `Create Private Threads` permission.' });
        }
    }
};
