const fs = require('fs');
const path = require('path');

const addenPath = path.join(__dirname, '..', '..', 'adden.json');

function getAddenList() {
    try {
        if (fs.existsSync(addenPath)) {
            return JSON.parse(fs.readFileSync(addenPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading adden list:', error);
    }
    return [];
}

function saveAddenList(list) {
    try {
        fs.writeFileSync(addenPath, JSON.stringify(list, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving adden list:', error);
        return false;
    }
}

module.exports = {
    config: {
        name: 'adden',
        aliases: ['enableadd', 'addallow'],
        role: 1,
        description: 'Enable/disable auto-adding feature in group'
    },
    run: async ({ api, event }) => {
        const addenList = getAddenList();
        const threadID = event.threadID;

        if (addenList.includes(threadID)) {
            const index = addenList.indexOf(threadID);
            addenList.splice(index, 1);
            saveAddenList(addenList);
            api.sendMessage('🔴 Auto-add disabled in this group!', threadID);
        } else {
            addenList.push(threadID);
            saveAddenList(addenList);
            api.sendMessage('✅ Auto-add enabled in this group!\n\n💡 Bot will automatically accept and add users who request to join.', threadID);
        }
    }
};
