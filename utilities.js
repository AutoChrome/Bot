class Utilities {
    ToNextHour() {
        return 3600000 - new Date().getTime() % 3600000;
    }

    ToNextMinute() {
        return 60000 - new Date().getTime() % 60000;
    }
}

module.exports = new Utilities();