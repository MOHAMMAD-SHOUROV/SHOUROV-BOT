const fs = require('fs');
const path = require('path');

const boxPath = path.join(__dirname, '..', '..', 'boxes.json');

module.exports = {
    config: { name: 'boxinfo', aliases: ['box-info'], role: 0, description: 'Get box information' },
    run: async ({ api, event }) => {
        try {
            const boxes = JSON.parse(fs.readFileSync(boxPath, 'utf8'));
            const userID = event.senderID;
            const count = (boxes[userID] || []).length;
            api.sendMessage(`📦 Box Information\n\nMessages: ${count}\nType /box list to view`, event.threadID);
        } catch (error) {
            api.sendMessage(`📦 Box is empty!`, event.threadID);
        }
    }
};
