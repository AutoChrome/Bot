const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageManager, MessageSelectMenu } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('upload')
		.setDescription('Upload your JS'),
	async execute(interaction) {
		await interaction.reply('Please upload your JSON in the next message.');
	},
};