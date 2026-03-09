const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function updateGameMessage(interaction, table) {
    const gameState = table.gameState;
    const player1 = table.players[0];
    const player2 = table.players[1];
    
    // Safety check if someone left
    if (!player1 || !player2) {
        table.status = 'finished';
        const embed = new EmbedBuilder().setColor('#e74c3c').setTitle('💀 Deathroll').setDescription('A player left the game. The game is over.');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('play_again').setLabel('Back to Lobby').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('close_table').setLabel('Close Table').setStyle(ButtonStyle.Danger)
        );
        if (table.messageId) {
            try {
                const oldMsg = await interaction.channel.messages.fetch(table.messageId);
                await oldMsg.delete();
            } catch (err) {}
        }
        const newMsg = await interaction.channel.send({ embeds: [embed], components: [row] });
        table.messageId = newMsg.id;
        if (!interaction.replied && !interaction.deferred) await interaction.deferUpdate();
        return;
    }
    
    const currentTurnPlayer = table.players[gameState.turnIndex];
    const maxRoll = gameState.currentMax;
    
    let description = `**Match:** ${player1.username} vs ${player2.username}\n\n`;
    
    if (gameState.history.length > 0) {
        description += `**History:**\n` + gameState.history.map(h => `- ${h.username} rolled **${h.roll}** (out of ${h.max})`).join('\n') + `\n\n`;
    }
    
    let embed = new EmbedBuilder().setTitle('💀 Deathroll').setColor('#e67e22');
    let row;
    
    if (gameState.currentMax === 1) {
        table.status = 'finished';
        const loser = gameState.history[gameState.history.length - 1].username;
        const winner = loser === player1.username ? player2 : player1;
        description += `💀 **${loser}** rolled a 1!\n\n🎉 <@${winner.id}> wins!`;
        
        row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('play_again')
                    .setLabel('Play Again')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('close_table')
                    .setLabel('Close Table')
                    .setStyle(ButtonStyle.Danger)
            );
    } else {
        description += `👉 It is **${currentTurnPlayer.username}**'s turn to roll (1-${maxRoll}).`;
        
        row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('roll_action')
                    .setLabel(`Roll (1-${maxRoll})`)
                    .setStyle(ButtonStyle.Primary)
            );
    }
    
    embed.setDescription(description);
    
    try {
        if (table.messageId) {
            try {
                const oldMsg = await interaction.channel.messages.fetch(table.messageId);
                await oldMsg.delete();
            } catch (err) {}
        }
        
        const newMsg = await interaction.channel.send({ embeds: [embed], components: [row] });
        table.messageId = newMsg.id;
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferUpdate(); // Acknowledge interaction
        }
    } catch(e) {
        console.error("Failed to update message: ", e);
    }
}

module.exports = {
    async start(interaction, table) {
        table.gameState = {
            currentMax: 100000,
            turnIndex: 0, // 0 for player1, 1 for player2
            history: []
        };
        await updateGameMessage(interaction, table);
    },
    
    async handleRoll(interaction, table) {
        const userId = interaction.user.id;
        const currentTurnPlayer = table.players[table.gameState.turnIndex];
        
        if (userId !== currentTurnPlayer.id) {
            return interaction.reply({ content: `❌ It is not your turn!`, ephemeral: true });
        }
        
        const max = table.gameState.currentMax;
        const roll = Math.floor(Math.random() * max) + 1;
        
        table.gameState.history.push({
            username: interaction.user.username,
            max: max,
            roll: roll
        });
        
        table.gameState.currentMax = roll;
        // switch turn
        table.gameState.turnIndex = table.gameState.turnIndex === 0 ? 1 : 0;
        
        await updateGameMessage(interaction, table);
    },
    
    async handleLeave(interaction, table) {
        await updateGameMessage(interaction, table);
    }
};
