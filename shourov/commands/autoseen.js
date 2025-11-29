const fs = require('fs');
const path = require('path');

const autoseenPath = path.join(__dirname, '..', '..', 'autoseen.json');

function getAutoseenList() {
    try {
        if (fs.existsSync(autoseenPath)) {
            return JSON.parse(fs.readFileSync(autoseenPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading autoseen list:', error);
    }
    return [];
}

function saveAutoseenList(list) {
    try {
        fs.writeFileSync(autoseenPath, JSON.stringify(list, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving autoseen list:', error);
        return false;
    }
}

module.exports = {
    config: {
        name: 'autoseen',
        aliases: ['auto-seen', 'read-auto'],
        role: 0,
        description: 'Automatically mark messages as seen'
    },
    run: async ({ api, event }) => {
        const autoseenList = getAutoseenList();
        const userID = event.senderID;

        if (autoseenList.includes(userID)) {
            autoseenList.splice(autoseenList.indexOf(userID), 1);
            api.sendMessage('✅ Auto-seen disabled!', event.threadID);
        } else {
            autoseenList.push(userID);
            api.sendMessage('✅ Auto-seen enabled! Messages will be auto-marked as seen.', event.threadID);
        }

        saveAutoseenList(autoseenList);
    }
};
