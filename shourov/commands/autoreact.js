const fs = require('fs');
const path = require('path');

const autoreactPath = path.join(__dirname, '..', '..', 'autoreact.json');

function getAutoreactList() {
    try {
        if (fs.existsSync(autoreactPath)) {
            return JSON.parse(fs.readFileSync(autoreactPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading autoreact list:', error);
    }
    return {};
}

function saveAutoreactList(list) {
    try {
        fs.writeFileSync(autoreactPath, JSON.stringify(list, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving autoreact list:', error);
        return false;
    }
}

module.exports = {
    config: {
        name: 'autoreact',
        aliases: ['auto-react', 'emoji-auto'],
        role: 1,
        description: 'Auto-react to messages'
    },
    run: async ({ api, event, args }) => {
        const autoreactList = getAutoreactList();
        const threadID = event.threadID;

        const emoji = args.length > 0 ? args[0] : '❤️';

        if (!autoreactList[threadID]) {
            autoreactList[threadID] = { enabled: false, emoji: '❤️' };
        }

        autoreactList[threadID].enabled = !autoreactList[threadID].enabled;
        autoreactList[threadID].emoji = emoji;
        saveAutoreactList(autoreactList);

        const status = autoreactList[threadID].enabled ? '✅ ENABLED' : '🔴 DISABLED';
        api.sendMessage(`${status} Auto-react with ${emoji}`, threadID);
    }
};
