const { username, password, database, host, port } = require('../config.json');
const { Pool } = require('pg');

class Reminder {
    constructor(channel_id, day, hour, name, description, role_id) {
        this.channel_id = channel_id;
        this.day = day;
        this.hour = hour;
        this.description = description;
        this.name = name;
        this.role_id = role_id;
    }

    save(interaction) {
        const days = [ "Sunday", "Monday", "Tuesday", "Thursday", "Friday", "Saturday"];

        const db = new Pool({
            user: username,
            host: host,
            database: database,
            password: password,
            port: port
        });

        db.query('INSERT INTO reminders (channel_id, day, hour, name, description, role_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING;', 
                 [this.channel_id, this.day, this.hour, this.name, this.description, this.role_id], function(error, result) {
            if(error == undefined) {
                interaction.reply(`Reminder ${interaction.options.getString('name')} added. It will ping every ${days[interaction.options.getInteger('day')]}.`);
                return true;
            }

            console.log(error);

            return false;
        });
    }
}

module.exports = { Reminder }