const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function updateGameMessage(interaction, table) {
    const gameState = table.gameState;
    let description = `Roll 1-100!\n\n**Players:**\n`;
    
    let allRolled = true;
    for (const player of table.players) {
        const roll = gameState.rolls[player.id];
        if (roll !== undefined) {
            description += `- ${player.username}: **${roll}**\n`;
        } else {
            description += `- ${player.username}: *Waiting...*\n`;
            allRolled = false;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('🎲 standard /roll')
        .setDescription(description)
        .setColor('#3498db');

    let row;
    if (allRolled) {
        table.status = 'finished'; // Update status
        
        let winner = null;
        let maxRoll = -1;
        let isTie = false;
        
        for (const player of table.players) {
            const r = gameState.rolls[player.id];
            if (r > maxRoll) {
                maxRoll = r;
                winner = player;
                isTie = false;
            } else if (r === maxRoll) {
                isTie = true;
            }
        }
        
        if (isTie) {
            embed.addFields({ name: 'Result', value: 'It\'s a tie!' });
        } else {
            embed.addFields({ name: 'Winner', value: `🎉 <@${winner.id}> wins with **${maxRoll}**!` });
        }
        
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
        row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('roll_action')
                    .setLabel('Roll (1-100)')
                    .setStyle(ButtonStyle.Primary)
            );
    }

    try {
        // To make the message float at the bottom, we delete the previous message and send a new one
        if (table.messageId) {
            try {
                const oldMsg = await interaction.channel.messages.fetch(table.messageId);
                await oldMsg.delete();
            } catch (err) {}
        }
        
        const newMsg = await interaction.channel.send({ embeds: [embed], components: [row] });
        table.messageId = newMsg.id;
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferUpdate(); // Acknowledge the interaction so it doesn't fail
        }
    } catch(e) {
        console.error("Failed to update message: ", e);
    }
}

module.exports = {
    async start(interaction, table) {
        table.gameState = { rolls: {} };
        await updateGameMessage(interaction, table);
    },
    
    async handleRoll(interaction, table) {
        const userId = interaction.user.id;
        
        // Ensure user is playing
        if (!table.players.find(p => p.id === userId)) {
            return interaction.reply({ content: '❌ You are not in this game!', ephemeral: true });
        }
        
        // Ensure user hasn't rolled
        if (table.gameState.rolls[userId] !== undefined) {
             return interaction.reply({ content: '❌ You already rolled!', ephemeral: true });
        }
        
        // Perform Roll
        const roll = Math.floor(Math.random() * 100) + 1;
        table.gameState.rolls[userId] = roll;
        
        await updateGameMessage(interaction, table);
    },
    
    async handleLeave(interaction, table) {
        // Recalculate display to account for removed player
        await updateGameMessage(interaction, table);
    }
};
