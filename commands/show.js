const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client } = require('discord.js');
const { Account } = require('../models/Account.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('show')
		.setDescription('Gets your monster info. (Must have a valid JSON uploaded)')
        .addStringOption(option =>
            option.setName('monster')
            .setDescription("The monster you wish to view")
            .setRequired(true)),
	async execute(interaction) {
		console.log(`interaction: ${interaction.user.id}`)
		account = new Account(interaction.user.id);
		console.log(account);
	},
};