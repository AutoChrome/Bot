const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client } = require('discord.js');
const { Guild } = require('../models/Guild.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add-guild')
		.setDescription('Add guild details')
        .addStringOption(option =>
            option.setName('name')
            .setDescription("The name of the guild you wish to add")
            .setRequired(true)),
	async execute(interaction) {
		guild = new Guild(interaction.options.getString('name'), interaction.channel.id);
        guild.save(interaction);
	},
};