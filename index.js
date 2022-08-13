const { Client, Collection, GatewayIntentBits, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const fs = require('fs');
const https = require('https');
const pretty = require("pretty");
const { REST } = require('@discordjs/rest');
const { Account } = require('./models/Account.js');
const utilities = require('./utilities.js');
const { username, password, database, host, port } = require('./config.json');
const { Pool } = require('pg');

/* 
    Initial variables 
*/

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const uploadWait = [];
var timer;

/*
    Functions
*/

function download(url, memberId) {
    if(!fs.existsSync(`./members`)) {
        fs.mkdir(`./members`, function(error){ if(error){console.log(error)} });
    }
    if(!fs.existsSync(`./members/${memberId}`)){
        fs.mkdir(`./members/${memberId}`, function(error){ if(error){console.log(error)}});
    }
    const file = fs.createWriteStream(`./members/${memberId}/main.json`);
    const request = https.get(url, function(response){response.pipe(file);});
}

function remind() {
    timer = setTimeout(remind, utilities.ToNextHour());
    var today = new Date();
    if(today.getTimezoneOffset() == 0) {
        today.setHours(today.getHours() + 1);
    }

    const db = new Pool({
        user: username,
        host: host,
        database: database,
        password: password,
        port: port
    });
    // var channel = client.channels.cache.get('1008024346087936030');
    // channel.send('Why Hello <@89770140769480704>')
    return true;
}

/*
    Command registration
*/

client.commands = new Collection();
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if(command.data == undefined) {
        continue;
    }
    const commandName = file.split(".")[0];
    commands.push(command.data.toJSON());

    console.log(`Attempting to load command ${commandName}`)
    client.commands.set(commandName, command);
}

rest = new REST({ version:'10'}).setToken(token);
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);

/*
    Event registration
*/

client.once('ready', () => {
    console.log("Ready!");
    remind();
});

client.on('messageCreate', function(message){
    if(uploadWait.length > 0) {
        //Check if user is trying to upload file.
        if(uploadWait.includes(message.member.id))
        {
            //Check if there was a file, if not cancel the upload request.
            if(message.attachments.size == 0)
            {
                for( var i = 0; i < uploadWait.length; i++)
                {
                    if(uploadWait[i] == message.member.id)
                    {
                        uploadWait.splice(i, 1);
                    }
                }
                message.channel.send("Upload action cancelled due to no attachments.");
                return false;
            }

            //Get URL
            downloadURL = message.attachments.first().url;

            //Check that the file is a JSON
            if(downloadURL.slice(-5).toUpperCase() != '.JSON')
            {
                message.channel.send('File was not a JSON. Please try again.');
                return false;
            }

            download(downloadURL, message.member.id);
            message.channel.send('Success! JSON has been added.');
            for( var i = 0; i < uploadWait.length; i++)
            {
                if(uploadWait[i] == message.member.id)
                {
                    uploadWait.splice(i, 1);
                }
            }
            return true;
        }
    }
});

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()){
        if(!interaction.isButton()) return;
    }else {
        const command = client.commands.get(interaction.commandName);
        if(!command) return;
    
        try {
            await command.execute(interaction);
        }catch(error) {
            console.error(error);
            await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
        }
    }
});

client.login(token);