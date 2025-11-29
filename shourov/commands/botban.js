const fs = require('fs');
const path = require('path');

const botbanPath = path.join(__dirname, '..', '..', 'botban.json');

function getBotbanList() {
    try {
        if (fs.existsSync(botbanPath)) {
            return JSON.parse(fs.readFileSync(botbanPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading botban list:', error);
    }
    return [];
}

function saveBotbanList(list) {
    try {
        fs.writeFileSync(botbanPath, JSON.stringify(list, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving botban list:', error);
        return false;
    }
}

module.exports = {
    config: {
        name: 'botban',
        aliases: ['ban-bot', 'blockbot'],
        role: 2,
        description: 'Ban bot from specific groups'
    },
    run: async ({ api, event }) => {
        const botbanList = getBotbanList();
        const threadID = event.threadID;

        if (botbanList.includes(threadID)) {
            botbanList.splice(botbanList.indexOf(threadID), 1);
            api.sendMessage('✅ Bot is now allowed in this group!', threadID);
        } else {
            botbanList.push(threadID);
            api.sendMessage('🔴 Bot is now banned from this group!', threadID);
        }

        saveBotbanList(botbanList);
    }
};
