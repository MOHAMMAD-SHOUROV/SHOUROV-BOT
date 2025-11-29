const fs = require('fs');
const path = require('path');

const autoPath = path.join(__dirname, '..', '..', 'auto.json');

function getAutoList() {
    try {
        if (fs.existsSync(autoPath)) {
            return JSON.parse(fs.readFileSync(autoPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading auto list:', error);
    }
    return {};
}

function saveAutoList(list) {
    try {
        fs.writeFileSync(autoPath, JSON.stringify(list, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving auto list:', error);
        return false;
    }
}

module.exports = {
    config: {
        name: 'auto',
        aliases: ['automation', 'auto-enable'],
        role: 1,
        description: 'Enable/disable automation features'
    },
    run: async ({ api, event }) => {
        const autoList = getAutoList();
        const threadID = event.threadID;

        if (!autoList[threadID]) {
            autoList[threadID] = { enabled: false };
        }

        autoList[threadID].enabled = !autoList[threadID].enabled;
        saveAutoList(autoList);

        const status = autoList[threadID].enabled ? '✅ ENABLED' : '🔴 DISABLED';
        api.sendMessage(`🤖 Automation ${status}\n\n💡 Features:\n- Auto-react\n- Auto-welcome\n- Auto-moderation`, threadID);
    }
};
