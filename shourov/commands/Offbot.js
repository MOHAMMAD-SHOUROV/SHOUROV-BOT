const fs = require('fs');
const path = require('path');

const offbotPath = path.join(__dirname, '..', '..', 'offbot.json');

function getOffbotList() {
    try {
        if (fs.existsSync(offbotPath)) {
            return JSON.parse(fs.readFileSync(offbotPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading offbot list:', error);
    }
    return [];
}

function saveOffbotList(list) {
    try {
        fs.writeFileSync(offbotPath, JSON.stringify(list, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving offbot list:', error);
        return false;
    }
}

module.exports = {
    config: {
        name: 'offbot',
        aliases: ['botoff', 'disablebot'],
        role: 1,
        description: 'Disable bot in this group'
    },
    run: async ({ api, event }) => {
        const offList = getOffbotList();
        const threadID = event.threadID;

        if (offList.includes(threadID)) {
            const index = offList.indexOf(threadID);
            offList.splice(index, 1);
            saveOffbotList(offList);
            api.sendMessage('✅ Bot has been enabled in this group!', threadID);
        } else {
            offList.push(threadID);
            saveOffbotList(offList);
            api.sendMessage('🔴 Bot has been disabled in this group!\nOnly admins can re-enable it.', threadID);
        }
    }
};
