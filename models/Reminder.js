const { username, password, database, host, port } = require('../config.json');
const { Pool } = require('pg');
const { EmbedBuilder } = require('discord.js');
const utilities = require('../utilities.js');

class Reminder {
    constructor(channel_id, day, hour, name, description, role_id, mention_id, interval = 0) {
        this.channel_id = channel_id;
        this.day = day;
        this.hour = hour;
        this.description = description;
        this.name = name;
        this.role_id = role_id;
        this.mention_id = mention_id;
        this.interval = interval;
        this.current_interval = 0;
    }

    save(interaction) {
        const days = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const db = new Pool({
            user: username,
            host: host,
            database: database,
            password: password,
            port: port
        });

        db.query('INSERT INTO reminders (channel_id, day, hour, name, description, role_id, mention_id, interval) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING;', 
                 [this.channel_id, this.day, this.hour, this.name, this.description, this.role_id, this.mention_id, this.interval], function(error, result) {
            if(error == undefined) {
                interaction.reply(`Reminder ${interaction.options.getString('name')} added. It will ping every ${days[interaction.options.getInteger('day')]}.`);
                return true;
            }

            console.log(error);

            return false;
        });
    }

    /*
    *
    *   Params:
    *       channel: Channel object that is to be sent via a client object
    *       id: The associated row of reminder
    * 
    */
    send(channel, id) {
        const db = new Pool({
            user: username,
            host: host,
            database: database,
            password: password,
            port: port
        });

        const embed = new EmbedBuilder()
                    .setColor(utilities.getRandomColor())
                    .setTitle(`${reminder.name}`)
                    .setDescription(`${reminder.description}`);

        if(this.interval > 0) {
            if(this.current_interval + 1 < this.interval) {
                db.query(`UPDATE reminders SET current_interval = $1 WHERE id = $2;`, [this.current_interval + 1, id]);
                db.close();
            } else {
                db.query(`UPDATE reminders SET current_interval = $1 WHERE id = $2;`, [0, id]);
                channel.send({ content: this.mention(), embeds: [embed] }).then(function(message) {
                    message.react('✅');
                });
                db.close();
            }
        } else {
           channel.send({ content: this.mention(), embeds: [embed] }).then(function(message) {
                message.react('✅');
           });
        }
    }

    mention() {
        if(this.role_id > 0) {
            return `<@&${this.role_id}>`;
        }
        
        if(this.mention_id > 0) {
            return `<@${this.mention_id}>`;
        }
        
        return ``;
    }
}

module.exports = { Reminder }