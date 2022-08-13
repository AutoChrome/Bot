const fs = require('fs');
const {Rune} = require('./Rune.js');
const {Artifact} = require('./Artifact.js');
const {Monster} = require('./Monster.js');

class Account {
    constructor(id) {
        this.user_id = id;

        try{
            const file = fs.readFileSync(`./members/${id}/main.json`, function(error) {
                if(error){
                    console.log(error);
                }
            });
        
            this.account = JSON.parse(file);
        }catch(error){
            console.log(error);
            this.account = {error:true}
        }
    }
}

module.exports = { Account }