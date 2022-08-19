const { SlashCommandBuilder } = require('@discordjs/builders');
const { Account } = require('../models/Account.js');
const utilities = require('../utilities.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('show')
		.setDescription('Gets your monster info. (Must have a valid JSON uploaded)')
        .addStringOption(option =>
            option.setName('monster')
            .setDescription("The monster you wish to view")
            .setRequired(true)),
	async execute(interaction) {
		account = new Account(interaction.user.id).account;
		monsters = [];
		id = utilities.getMonsterByName(interaction.options.getString('monster'));
		console.log(id);
		for(let i in account.unit_list) {
			monster = account.unit_list[i];
			if(monster.unit_master_id == id) {
				monsters.push(monster);
			}
		}

		console.log(monsters.length);
	},
};