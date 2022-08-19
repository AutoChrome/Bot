const monsters = require('./monster-list.json');
const fs = require('fs');
const { username, password, database, host, port } = require('./config.json');
const pgp = require('pg-promise')();

class Utilities {
    ToNextHour() {
        return 3600500 - new Date().getTime() % 3600500;
    }

    ToNextMinute() {
        return 60000 - new Date().getTime() % 60000;
    }

    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    getMonsterByName(name) {
        for(let id in monsters.names){
            if(name.toUpperCase() == monsters.names[id].toUpperCase()){
                return id;
            }
        }
    }

    async checkMonsterList(db) {
        var count = Object.keys(monsters.names).length;

        var result = await db.any('SELECT COUNT(*) FROM master_unit_list');

        if(count == result[0].count) {
            console.log('Monsters do not need updating.');
            return;
        }

        var values = [];

        for(var monster in monsters.names)
            values.push({ id: monster, name: monsters.names[monster] });

        const cs = new pgp.helpers.ColumnSet(['id', 'name'], {table: 'master_unit_list'});
        const onConflict = ' ON CONFLICT(id) DO UPDATE SET ' + cs.assignColumns({from: 'EXCLUDED', skip: ['id']});
        const query = pgp.helpers.insert(values, cs) + onConflict;
        await db.none(query);
    }

    async importAccount(db, id) {
        try {
            const file = fs.readFileSync(`./members/${BigInt(id)}/main.json`, function(error) {
                if(error){
                    console.log(error);
                    var account = {error:true}
                }
            });
        
            var account = JSON.parse(file);
        } catch(error){
            console.log(error);
            var account = {error:true}
        }

        importMonsters(db, account.unit_list);
        importRunes(db, account.unit_list, account.runes)
    }
}

async function importMonsters(db, monsters) {
    var accountMonsters = [];

    var ids = await db.any('SELECT id FROM master_unit_list');

    for(var monster in monsters) {
        //Skip rainbowmon and devilmon
        if(monsters[monster].unit_master_id == 14314 || monsters[monster].unit_master_id == 15105){
            continue;
        }

        if (ids.filter(row => row.id == monsters[monster].unit_master_id).length > 0) {
            accountMonsters.push({
                id: monsters[monster].unit_id,
                account_id: monsters[monster].wizard_id,
                unit_master_id: monsters[monster].unit_master_id,
                unit_level: monsters[monster].unit_level,
                class: monsters[monster].class,
                hp: monsters[monster].con,
                attack: monsters[monster].atk,
                def: monsters[monster].def,
                speed: monsters[monster].spd,
                resist: monsters[monster].resist,
                accuracy: monsters[monster].accuracy,
                critical_rate: monsters[monster].critical_rate,
                critical_damage: monsters[monster].critical_damage,
                skills: JSON.stringify(monsters[monster].skills),
            });
        } else if (ids.filter(row => row.id == parseInt(monsters[monster].unit_master_id.toString().slice(0, -2))).length > 0) {
            accountMonsters.push({
                id: monsters[monster].unit_id,
                account_id: monsters[monster].wizard_id,
                unit_master_id: parseInt(monsters[monster].unit_master_id.toString().slice(0, -2)),
                unit_level: monsters[monster].unit_level,
                class: monsters[monster].class,
                hp: monsters[monster].con,
                attack: monsters[monster].atk,
                def: monsters[monster].def,
                speed: monsters[monster].spd,
                resist: monsters[monster].resist,
                accuracy: monsters[monster].accuracy,
                critical_rate: monsters[monster].critical_rate,
                critical_damage: monsters[monster].critical_damage,
                skills: JSON.stringify(monsters[monster].skills),
            });
        }else {
            console.log(monsters[monster].unit_master_id);
        }
    }

    const cs = new pgp.helpers.ColumnSet(['id', 'account_id', 'unit_master_id', 'unit_level', 'class', 'hp', 'attack',
                                          'def','speed', 'resist', 'accuracy', 'critical_rate', 'critical_damage',
                                          'skills'], {table: 'account_monsters'});
    const onConflict = ' ON CONFLICT(id) DO UPDATE SET ' + cs.assignColumns({from: 'EXCLUDED', skip: ['id']});
    const query = pgp.helpers.insert(accountMonsters, cs) + onConflict;
    await db.none(query);
}

async function importRunes(db, monsters, runes) {
    var accountRunes = [];

    for(var monster in monsters)
        for(var rune in monsters[monster].runes)
            accountRunes.push({
                id: monsters[monster].runes[rune].rune_id,
                account_id: monsters[monster].runes[rune].wizard_id,
                slot: monsters[monster].runes[rune].slot_no,
                set_id: monsters[monster].runes[rune].set_id,
                upgrade_curr: monsters[monster].runes[rune].upgrade_curr,
                class: monsters[monster].runes[rune].class,
                primary_stat: JSON.stringify(monsters[monster].runes[rune].pri_eff),
                innate_stat: JSON.stringify(monsters[monster].runes[rune].prefix_eff),
                secondary_stats: JSON.stringify(monsters[monster].runes[rune].sec_eff),
                account_monster_id: monsters[monster].runes[rune].occupied_id,
                rank: monsters[monster].runes[rune].rank
            });

    for(var rune in runes)
        accountRunes.push({
            id: runes[rune].rune_id,
            account_id: runes[rune].wizard_id,
            slot: runes[rune].slot_no,
            set_id: runes[rune].set_id,
            upgrade_curr: runes[rune].upgrade_curr,
            class: runes[rune].class,
            primary_stat: JSON.stringify(runes[rune].pri_eff),
            innate_stat: JSON.stringify(runes[rune].prefix_eff),
            secondary_stats: JSON.stringify(runes[rune].sec_eff),
            account_monster_id: runes[rune].occupied_id,
            rank: runes[rune].rank
        });

    const cs = new pgp.helpers.ColumnSet(['id', 'account_id', 'slot', 'set_id', 'upgrade_curr', 'class', 'primary_stat',
                                          'innate_stat','secondary_stats', 'account_monster_id', 'rank'], {table: 'account_runes'});
    const onConflict = ' ON CONFLICT(id) DO UPDATE SET ' + cs.assignColumns({from: 'EXCLUDED', skip: ['id']});
    const query = pgp.helpers.insert(accountRunes, cs) + onConflict;
    await db.none(query);
}

module.exports = new Utilities();