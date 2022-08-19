const {Rune} = require('./Rune.js');
const {Artifact} = require('./Artifact.js');
const monsters = require('../monster-list.json');

class Monster {
    constructor(info) {
        console.log(info);
    }
}

module.exports = { Monster }