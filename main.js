const { Client, Collection, Intents, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { token, clientId } = require('./config.json');
const monsterList = require('./sw-parse.js');
const fs = require('fs');
const https = require('https');
const { REST } = require('@discordjs/rest');
require('./deploy-commands.js');

/* 
    Initial variables 
*/

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES]});
client.commands = new Collection();
const commands = [];
const uploadWait = []
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

/*
    Functions
*/

function download(url, memberId){
    if(!fs.existsSync(`./members`)) {
        fs.mkdir(`./members`, function(error){ if(error){console.log(error)} });
    }
    if(!fs.existsSync(`./members/${memberId}`)){
        fs.mkdir(`./members/${memberId}`, function(error){ if(error){console.log(error)}});
    }
    const file = fs.createWriteStream(`./members/${memberId}/main.json`);
    const request = https.get(url, function(response){response.pipe(file);});
}

function getAccount(memberId){
    try{
        file = fs.readFileSync(`./members/${memberId}/main.json`, function(error) {
            if(error){
                console.log(error);
            }
        });
    
        account = JSON.parse(file);
    }catch(error){
        account = {error:true}
    }

    return account;
}

function getMonster(account, monsterId){
    result = [];
    for(j = 0; j < monsterId.length; j++){
        for(i = 0; i < Object.keys(account.unit_list).length; i++){
            if(monsterId[j] == account.unit_list[i].unit_master_id){
                result.push(account.unit_list[i]);
            }
        }
    }
    return result;
}

function getMonsterByUniqueId(account, id){
    for(i = 0; i < Object.keys(account.unit_list).length; i++){
        if(id == account.unit_list[i].unit_id){
            return account.unit_list[i];
        }
    }
}

function getWorldArenaRunes(account, monster_id){
    rune_ids = [];

    for(i = 0; i < Object.keys(account.world_arena_rune_equip_list).length; i++){
        if(account.world_arena_rune_equip_list[i].occupied_id == monster_id){
            rune_ids.push(([account.world_arena_rune_equip_list[i].rune_id, account.world_arena_rune_equip_list[i].occupied_id]));
        }
    }

    return getRunes(account, rune_ids);
}

function getWorldArenaArtifacts(account, monster_id){
    artifact_ids = [];

    for(i = 0; i < Object.keys(account.world_arena_artifact_equip_list).length; i++){
        if(account.world_arena_artifact_equip_list[i].occupied_id == monster_id){
            artifact_ids.push(([account.world_arena_artifact_equip_list[i].artifact_id, account.world_arena_artifact_equip_list[i].occupied_id]));
        }
    }

    return getArtifacts(account, artifact_ids);
}

function getRunes(account, rune_list){
    runes = [];

    for(rune_count = 0; rune_count <  rune_list.length; rune_count++){
        for(i = 0; i < Object.keys(account.unit_list).length; i++){
            for(rune in account.unit_list[i].runes){
                if(account.unit_list[i].runes[rune].rune_id == rune_list[rune_count][0]){
                    runes.push(account.unit_list[i].runes[rune]);
                }
            }
        }
        for(i = 0; i < Object.keys(account.runes).length; i++){
            if(rune_list[rune_count][0] == account.runes[i].rune_id){
                runes.push(account.runes[i]);
            }
        }
    }

    runes.sort(function(a, b){
        return a.slot_no - b.slot_no;
    });

    return runes;
}

function getArtifacts(account, artifact_list){
    artifacts = [];

    for(artifact_count = 0; artifact_count <  artifact_list.length; artifact_count++){
        for(i = 0; i < Object.keys(account.unit_list).length; i++){
            for(artifact in account.unit_list[i].artifacts){
                if(account.unit_list[i].artifacts[artifact].rid == artifact_list[artifact_count][0]){
                    artifacts.push(account.unit_list[i].artifacts[artifact]);
                }
            }
        }
        for(i = 0; i < Object.keys(account.artifacts).length; i++){
            if(artifact_list[artifact_count][0] == account.artifacts[i].rid){
                artifacts.push(account.artifacts[i]);
            }
        }
    }

    return artifacts;
}

function formatRune(rune){
    display = {
        slot: 0,
        level: 0,
        grade: '',
        set: '',
        pri_stat: {},
        innate_stat: {},
        sec_stats: [],
        eff: []
    }

    display.slot = rune.slot_no;
    display.grade = monsterList.rune.quality[rune.rank];
    display.set = monsterList.rune.sets[rune.set_id];
    display.level = rune.upgrade_curr;
    display.pri_stat = [monsterList.rune.effectTypes[rune.pri_eff[0]], rune.pri_eff[1]];
    display.innate_stat = [monsterList.rune.effectTypes[rune.prefix_eff[0]], rune.prefix_eff[1]];
    display.eff = monsterList.getRuneEfficiency(rune);

    for(sec_counter = 0; sec_counter < Object.keys(rune.sec_eff).length; sec_counter++){
        display.sec_stats.push([monsterList.rune.effectTypes[rune.sec_eff[sec_counter][0]], rune.sec_eff[sec_counter][1] + rune.sec_eff[sec_counter][3]]);
    }

    return display
}

function formatArtifact(artifact){
    sub = {
        200: (value) => `ATK Increased Proportional to Lost HP up to ${value}%`,
        201: (value) => `DEF Increased Proportional to Lost HP up to ${value}%`,
        202: (value) => `SPD Increased Proportional to Lost HP up to ${value}%`,
        203: (value) => `SPD Under Inability Effects +${value}%`,
        204: (value) => `ATK Increasing Effect +${value}%`,
        205: (value) => `DEF Increasing Effect +${value}%`,
        206: (value) => `SPD Increasing Effect +${value}%`,
        207: (value) => `Crit Rate Increasing Effect +${value}%`,
        208: (value) => `Damage Dealt by Counterattack +${value}%`,
        209: (value) => `Damage Dealt by Attacking Together +${value}%`,
        210: (value) => `Bomb Damage +${value}%`,
        211: (value) => `Damage Dealt by Reflected DMG +${value}%`,
        212: (value) => `Crushing Hit DMG +${value}%`,
        213: (value) => `Damage Received Under Inability Effect -${value}%`,
        214: (value) => `Received Crit DMG -${value}%`,
        215: (value) => `Life Drain +${value}%`,
        216: (value) => `HP when Revived +${value}%`,
        217: (value) => `Attack Bar when Revived +${value}%`,
        218: (value) => `Additional Damage by ${value}% of HP`,
        219: (value) => `Additional Damage by ${value}% of ATK`,
        220: (value) => `Additional Damage by ${value}% of DEF`,
        221: (value) => `Additional Damage by ${value}% of SPD`,
        222: (value) => `CRIT DMG+ up to ${value}% as the enemy's HP condition is good`,
        223: (value) => `CRIT DMG+ up to ${value}% as the enemy's HP condition is bad`,
        224: (value) => `Single-target skill CRIT DMG ${value}% on your turn`,
        300: (value) => `Damage Dealt on Fire +${value}%`,
        301: (value) => `Damage Dealt on Water +${value}%`,
        302: (value) => `Damage Dealt on Wind +${value}%`,
        303: (value) => `Damage Dealt on Light +${value}%`,
        304: (value) => `Damage Dealt on Dark +${value}%`,
        305: (value) => `Damage Received from Fire -${value}%`,
        306: (value) => `Damage Received from Water -${value}%`,
        307: (value) => `Damage Received from Wind -${value}%`,
        308: (value) => `Damage Received from Light -${value}%`,
        309: (value) => `Damage Received from Dark -${value}%`,
        400: (value) => `Skill 1 CRIT DMG +${value}%`,
        401: (value) => `Skill 2 CRIT DMG +${value}%`,
        402: (value) => `Skill 3 CRIT DMG +${value}%`,
        403: (value) => `Skill 4 CRIT DMG +${value}%`,
        404: (value) => `Skill 1 Recovery +${value}%`,
        405: (value) => `Skill 2 Recovery +${value}%`,
        406: (value) => `Skill 3 Recovery +${value}%`,
        407: (value) => `Skill 1 Accuracy +${value}%`,
        408: (value) => `Skill 2 Accuracy +${value}%`,
        409: (value) => `Skill 3 Accuracy +${value}%`,
    }
    
    display = {
        type: 0,
        level: 0,
        grade: '',
        pri_stat: {},
        sec_stats: []
    }

    display.type = monsterList.artifact.types[artifact.type];
    display.level = artifact.level;
    display.grade = monsterList.artifact.rank[artifact.rank];
    display.pri_stat = [monsterList.artifact.effectTypes.main[artifact.pri_effect[0]], artifact.pri_effect[1]];
    for(counter = 0; counter < artifact.sec_effects.length; counter++){
        display.sec_stats.push([sub[artifact.sec_effects[counter][0]], artifact.sec_effects[counter][1]]);
    }
    
    return display;
}

function displayMonster(monster, lastUploaded, titleCheck, memberName, rtaRunes, rtaArtifacts)
{
    date = new Date(lastUploaded);
    title = monsterList.getMonsterName(monster.unit_master_id) + ' - ';
    if(rtaRunes == undefined && rtaArtifacts == undefined){
        monsterInfo = calculateBonus(monster.runes, monster.artifacts);
    }else{
        monsterInfo = calculateBonus(rtaRunes, rtaArtifacts);
    }

    if(rtaRunes == undefined){
        runes = [];
        for(i = 0; i < Object.keys(monster.runes).length; i++){
            rune = formatRune(monster.runes[i]);
            runes.push(rune);
        }
    }else{
        runes = [];
        for(i = 0; i < rtaRunes.length; i++){
            rune = formatRune(rtaRunes[i]);
            runes.push(rune);
        }
    }

    if(rtaArtifacts == undefined){
        artifacts = [];
        for(i = 0; i < Object.keys(monster.artifacts).length; i++){
            artifacts.push(formatArtifact(monster.artifacts[i]));
        }
    }else{
        artifacts = [];
        for(i = 0; i < rtaArtifacts.length; i++){
            artifacts.push(formatArtifact(rtaArtifacts[i]));
        }
    }

    for(set in monsterInfo.sets){
        if(Math.floor(monsterInfo.sets[set][0] / monsterInfo.sets[set][2]) > 0){
            title += monsterInfo.sets[set][1] + ' ';
        }
    }

    if(Math.floor(monsterInfo.sets[3][0] / monsterInfo.sets[3][2]) > 0){
        monsterInfo.stats[8] += Math.ceil(monster.spd * 0.25);
    }

    const exampleEmbed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle(`${memberName}'s ${title} ${titleCheck}`);
    for(i = 0; i < runes.length; i++){
        if(runes[i].innate_stat[1] > 0){
            exampleEmbed.addField(`Slot ${runes[i].slot} - ${runes[i].set}`, 
            `Level: ${runes[i].level} [${runes[i].grade}]
            Efficiency: ${runes[i].eff.current}/${runes[i].eff.max}
            **${runes[i].pri_stat[0]}**: ${runes[i].pri_stat[1]}
            *${runes[i].innate_stat[0]}*: ${runes[i].innate_stat[1]}
            ${runes[i].sec_stats[0][0]}: ${runes[i].sec_stats[0][1]}
            ${runes[i].sec_stats[1][0]}: ${runes[i].sec_stats[1][1]}
            ${runes[i].sec_stats[2][0]}: ${runes[i].sec_stats[2][1]}
            ${runes[i].sec_stats[3][0]}: ${runes[i].sec_stats[3][1]}
            `, true);
        }else{
            sub = "";
            for(k = 0; k < runes[i].sec_stats.length; k++) {
                sub += runes[i].sec_stats[k][0] + ": " + runes[i].sec_stats[0][1] + "\n";
            }
            exampleEmbed.addField(`Slot ${runes[i].slot} - ${runes[i].set}`, 
            `Level: ${runes[i].level} [${runes[i].grade}]
            Efficiency: ${runes[i].eff.current}/${runes[i].eff.max}
            **${runes[i].pri_stat[0]}**: ${runes[i].pri_stat[1]}
            ${sub}
            
            `, true);
        }
    }

    for(i = runes.length; i < 6; i++){
        exampleEmbed.addField(`No rune equipped`, `N/A`, true);
    }

    for(j = 0; j < artifacts.length; j++){
        exampleEmbed.addField(`Type ${artifacts[j].type}`, 
        `Level: ${artifacts[j].level} [${artifacts[j].grade}]
        **${artifacts[j].pri_stat[0]}**: ${artifacts[j].pri_stat[1]}
        ${artifacts[j].sec_stats[0][0](artifacts[j].sec_stats[0][1])}
        ${artifacts[j].sec_stats[1][0](artifacts[j].sec_stats[1][1])}
        ${artifacts[j].sec_stats[2][0](artifacts[j].sec_stats[2][1])}
        ${artifacts[j].sec_stats[3][0](artifacts[j].sec_stats[3][1])}
        `, true);
    }
    
    exampleEmbed.addField('\u200B', '\u200B');
    exampleEmbed.addField('Base stats', 
    `HP: ${monster.con * 15}
    ATK: ${monster.atk}
    DEF: ${monster.def}
    SPD: ${monster.spd}
    Cri Rate: ${monster.critical_rate}%
    Cri Dmg: ${monster.critical_damage}%
    Resistance: ${monster.resist}%
    Accuracy: ${monster.accuracy}%`, 
    true);
    exampleEmbed.addField('Bonus', `
    +${Math.ceil((monster.con * 15) * (monsterInfo.stats[2] / 100)) + monsterInfo.stats[1]}
    +${Math.ceil(monster.atk * (monsterInfo.stats[4] / 100)) + monsterInfo.stats[3]}
    +${Math.ceil(monster.def * (monsterInfo.stats[6] / 100)) + monsterInfo.stats[5]}
    +${monsterInfo.stats[8]}
    +${monsterInfo.stats[9]}%
    +${monsterInfo.stats[10]}%
    +${monsterInfo.stats[11]}%
    +${monsterInfo.stats[12]}%`, 
    true);
    exampleEmbed.addField('Total', `
    HP: ${(monster.con * 15) + Math.ceil((monster.con * 15) * 0.95) + monsterInfo.stats[1]}
    ATK: ${monster.atk + Math.ceil(monster.atk * (monsterInfo.stats[4] / 100)) + monsterInfo.stats[3]}
    DEF: ${monster.def + Math.ceil(monster.def * (monsterInfo.stats[6] / 100)) + monsterInfo.stats[5]}
    SPD: ${monster.spd + monsterInfo.stats[8]}
    Cri Rate: ${monster.critical_rate + monsterInfo.stats[9]}%
    Cri Dmg: ${monster.critical_damage  + monsterInfo.stats[10]}%
    Resistance: ${monster.resist  + monsterInfo.stats[11]}%
    Accuracy: ${monster.accuracy  + monsterInfo.stats[12]}%`, 
    true);
    exampleEmbed.setFooter('Last uploaded: ' + date.toString());

    return exampleEmbed;
}

function calculateBonus(runeSet, artifacts){
    stats = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
    }

    sets = {
        1: [0, 'Energy', 2],
        2: [0, 'Guard', 2],
        3: [0, 'Swift', 4],
        4: [0, 'Blade', 2],
        5: [0, 'Rage', 4],
        6: [0, 'Focus', 2],
        7: [0, 'Endure', 2],
        8: [0, 'Fatal', 4],
        10: [0, 'Despair', 4],
        11: [0, 'Vampire', 4],
        13: [0, 'Violent', 4],
        14: [0, 'Nemesis', 2],
        15: [0, 'Will', 2],
        16: [0, 'Shield', 2],
        17: [0, 'Revenge', 2],
        18: [0, 'Destroy', 2],
        19: [0, 'Fight', 2],
        20: [0, 'Determination', 2],
        21: [0, 'Enhance', 2],
        22: [0, 'Accuracy', 2],
        23: [0, 'Tolerance', 2],
    }
      
    for(count = 0; count < runeSet.length; count++)
    {
        stats[runeSet[count].pri_eff[0]] += runeSet[count].pri_eff[1];
        stats[runeSet[count].prefix_eff[0]] += runeSet[count].prefix_eff[1];
        sets[runeSet[count].set_id][0] = sets[runeSet[count].set_id][0] + 1
        for(sub_count = 0; sub_count < runeSet[count].sec_eff.length; sub_count++){
            stats[runeSet[count].sec_eff[sub_count][0]] += runeSet[count].sec_eff[sub_count][1];
            stats[runeSet[count].sec_eff[sub_count][0]] += runeSet[count].sec_eff[sub_count][3];
        }
    }

    if(artifacts){
        for(count = 0; count < artifacts.length; count++){
            if(artifacts[count].pri_effect[0] == 100){
                stats[1] += artifacts[count].pri_effect[1];
            }else if(artifacts[count].pri_effect[0] == 101){
                stats[3] += artifacts[count].pri_effect[1];
            }else if(artifacts[count].pri_effect[0] == 103){
                stats[5] += artifacts[count].pri_effect[1];
            }
        }
    }

    return {stats: this.stats, sets: this.sets}
}

/*
    Command registration
*/

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

rest = new REST({ version:'9'}).setToken(token);
(async() => {
    try{
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );
    }catch(error){
        console.error(error);
    }
});

/*
    Event registration
*/

client.once('ready', () => {
    console.log("Ready!");
});

client.on('messageCreate', function(message){
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
});

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if(!command) return;

    switch(command.data.name) {
        case "upload":
            uploadWait.push(interaction.member.id);
            break;
        case "show":
            memberId = interaction.member.id;
            account = getAccount(memberId);
            if(account.error == true){
                await interaction.reply({ content:'There was an error trying to get the data. Please upload a new JSON and try again.', ephermal: true});
                return;
            }
            result = getMonster(account, monsterList.getMonsterID(interaction.options.getString('monster')));
            row = new MessageActionRow();
            if(result.length > 0)
            {
                for(i = 0; i < result.length; i++){
                    runes = calculateBonus(result[i].runes, result[i].artifacts);
                    row.addComponents(new MessageButton().setCustomId(`${result[i].unit_id}`).setLabel(`${monsterList.getMonsterName(result[i].unit_master_id)}, SPD: ${runes.stats[8] + result[i].spd}`).setStyle('PRIMARY'));
                }
                await interaction.reply({ content:'Select a monster:', components: [row], ephemeral: true});

                const collector = interaction.channel.createMessageComponentCollector({ time: 15000 });

                collector.on('collect', async function(event) {
                    fs.stat(`./members/${memberId}/main.json`, function(err, stats){
                        if(err){
                            console.log(err);
                        }else{
                            lastUploaded = stats.mtime;
                        }
                    });
                    monster = getMonsterByUniqueId(account, event.customId);
                    await event.update({ content: 'Here is your monster!', components: [], ephemeral: false});
                    event.channel.send({embeds: [displayMonster(monster, lastUploaded, '', interaction.member.displayName)]});
                    collector.stop();
                });
            } else{
                await interaction.reply({ content: 'There was no monster with that name.', ephemeral: false});
            }
            break;
        case 'rta':
            memberId = interaction.member.id;
            account = getAccount(memberId);
            if(account.error == true){
                await interaction.reply({ content:'There was an error trying to get the data. Please upload a new JSON and try again.', ephermal: true});
                return;
            }

            result = getMonster(account, monsterList.getMonsterID(interaction.options.getString('monster')));
            row = new MessageActionRow();

            if(result.length > 0)
            {
                for(i = 0; i < result.length; i++){
                    id = result[i].unit_id
                    unique_id = result[i].unit_master_id;
                    spd = result[i].spd
                    runes = calculateBonus(getWorldArenaRunes(account, id), getWorldArenaArtifacts(account, id));
                    row.addComponents(new MessageButton().setCustomId(`${id}`).setLabel(`${monsterList.getMonsterName(unique_id)}, SPD: ${runes.stats[8] + spd}`).setStyle('PRIMARY'));
                }
                await interaction.reply({ content:'Select a monster:', components: [row], ephemeral: true});

                const collector = interaction.channel.createMessageComponentCollector({ time: 15000 });

                collector.on('collect', async function(event) {
                    fs.stat(`./members/${memberId}/main.json`, function(err, stats){
                        if(err){
                            console.log(err);
                        }else{
                            lastUploaded = stats.mtime;
                        }
                    });
                    monster = getMonsterByUniqueId(account, event.customId);
                    rtaRunes = getWorldArenaRunes(account, monster.unit_id);
                    rtaArtifacts = getWorldArenaArtifacts(account, monster.unit_id);
                    await event.update({ content: 'Here is your monster!', components: [], ephemeral: false});
                    event.channel.send({embeds: [displayMonster(monster, lastUploaded, 'RTA', interaction.member.displayName, rtaRunes, rtaArtifacts)]});
                    collector.stop();
                });
            } else{
                await interaction.reply({ content: 'There was no monster with that name.', ephemeral: false});
            }
            break;
        default:
            interaction.reply('That command is in WIP. Please wait.')
            break;
    }

    try {
        await command.execute(interaction);
    } catch(error){
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true});
    }
});

client.login(token);