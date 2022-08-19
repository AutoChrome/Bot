const fs = require('fs');
const https = require('https');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageManager, MessageSelectMenu } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('upload')
		.setDescription('Upload your JS')
		.addAttachmentOption(option =>
            option.setName('account')
            .setDescription("Upload a JSON file")
            .setRequired(true)),
	async execute(interaction) {
		interaction.deferReply();
		const file = interaction.options.getAttachment('account');
		const dir = `./members/${interaction.user.id}`;
		if(file.name.split('.')[1] != "json") {
			interaction.reply({ content: 'This file is not a valid type. Please upload a .json file.', ephemeral: true });
			return;
		}

		if (!fs.existsSync(dir)) {
			fs.mkdir(dir);
		}
		
		https.get(file.attachment, function(res) {
			const download = fs.createWriteStream(`${dir}/main.json`);

			res.pipe(download);

			download.on('finish', function() {
				download.close();
			});
		});
	},
};