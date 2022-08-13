class Rune {

    constructor(slot = 0, level = 0, grade, set, pri_stat, innate_stat, sec_stats) {
        this.slot = slot;
        this.level = level;
        this.grade = grade;
        this.set = set;
        this.pri_stat = pri_stat;
        this.innate_stat = innate_stat;
        this.sec_stats = sec_stats;
    }

    format(){
        
    }
}

module.exports = { Rune }