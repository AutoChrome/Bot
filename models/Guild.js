const { username, password, database, host, port } = require('../config.json');
const { Pool } = require('pg');

class Guild {
    constructor(name, channel_id) {
        this.name = name;
        this.channel_id = channel_id
    }

    static get(channel_id) {
        
    }

    save(interaction) {
        const db = new Pool({
            user: username,
            host: host,
            database: database,
            password: password,
            port: port
        });

        db.query('INSERT INTO guilds (name, channel_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING;', [this.name, this.channel_id], function(error, result) {
            if(error == undefined) {
                interaction.reply(`Guild ${interaction.options.getString('name')} added`);
                db.end();
                return true;
            }
            db.end();
            return false;
        });
    }
}

module.exports = { Guild }