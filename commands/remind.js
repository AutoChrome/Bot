const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client } = require('discord.js');
const { Reminder } = require('../models/Reminder.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remind')
		.setDescription('Add guild details')
        .addStringOption(option =>
            option.setName('name')
            .setDescription("The name of the reminder you wish to add")
            .setRequired(true))
		.addIntegerOption(option =>
			option.setName('day')
			.setDescription("The day each week to remind")
			.setRequired(true)
			.addChoices(
				{ name: 'Sunday', value: 0},
				{ name: 'Monday', value: 1},
				{ name: 'Tuesday', value: 2},
				{ name: 'Wednesday', value: 3},
				{ name: 'Thursday', value: 4},
				{ name: 'Friday', value: 5},
				{ name: 'Saturday', value: 6}
			))
		.addIntegerOption(option =>
			option.setName('hour')
			.setDescription("The hour of the week. (Use 24 hour, 10, 22)")
			.setRequired(true))
		.addRoleOption(option =>
			option.setName('role')
			.setDescription("The role that will be pinged.")
			.setRequired(false))
		.addUserOption(option =>
			option.setName('mention')
			.setDescription("The user that will be pinged.")
			.setRequired(false))
		.addIntegerOption(option =>
			option.setName('interval')
			.setDescription("How many weeks apart should it ping")
			.setRequired(false))
		.addStringOption(option =>
			option.setName('description')
			.setDescription("Description to be displayed for the reminder")
			.setRequired(false)),
	async execute(interaction) {
		reminder = new Reminder(interaction.channel.id, interaction.options.getInteger('day'), interaction.options.getInteger('hour'), 
								interaction.options.getString('name'), interaction.options.getString('description'), interaction.options.getRole('role')?.id, 
								interaction.options.getUser('mention')?.id, interaction.options.getInteger('interval'));
		reminder.save(interaction);
		console.log(reminder);
	},
};