const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flair')
        .setDescription('Toggle the Gambler flair to access the casino lobby'),

    async execute(interaction) {
        const guild = interaction.guild;
        const member = interaction.member;

        // Attempt to find the role
        let role = guild.roles.cache.find(r => r.name === 'Gambler');

        // Fetch all roles if not cached
        if (!role) {
            const roles = await guild.roles.fetch();
            role = roles.find(r => r.name === 'Gambler');
        }

        // If still not found, create it
        if (!role) {
            role = await guild.roles.create({
                name: 'Gambler',
                color: 'Gold',
                reason: 'Auto-created for casino access',
            });
        }

        // Toggle the role on the user
        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            return interaction.reply({ content: '🎭 You have left the casino lobby.', ephemeral: true });
        } else {
            await member.roles.add(role);
            return interaction.reply({ content: '🎰 You now have access to the casino lobby!', ephemeral: true });
        }
    }
};
