const fs = require('fs');
const path = require('path');

const autobanPath = path.join(__dirname, '..', '..', 'autoban.json');

function getAutobanList() {
    try {
        if (fs.existsSync(autobanPath)) {
            return JSON.parse(fs.readFileSync(autobanPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading autoban list:', error);
    }
    return [];
}

function saveAutobanList(list) {
    try {
        fs.writeFileSync(autobanPath, JSON.stringify(list, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving autoban list:', error);
        return false;
    }
}

module.exports = {
    config: {
        name: 'autoban',
        aliases: ['auto-ban', 'banmods'],
        role: 1,
        description: 'Automatically ban rule violators'
    },
    run: async ({ api, event }) => {
        const autobanList = getAutobanList();
        const threadID = event.threadID;

        if (autobanList.includes(threadID)) {
            autobanList.splice(autobanList.indexOf(threadID), 1);
            api.sendMessage('✅ Auto-ban disabled!', threadID);
        } else {
            autobanList.push(threadID);
            api.sendMessage('🔒 Auto-ban enabled! Violations will auto-ban users.', threadID);
        }

        saveAutobanList(autobanList);
    }
};
