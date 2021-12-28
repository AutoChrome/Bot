const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageManager, MessageSelectMenu } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('show')
		.setDescription('Gets your monster info. (Must have a valid JSON uploaded)')
        .addStringOption(option =>
            option.setName('monster')
            .setDescription("The monster you wish to view")
            .setRequired(true)),
	async execute(interaction) {
	},
};