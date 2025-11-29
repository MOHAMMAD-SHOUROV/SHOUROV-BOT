const fs = require('fs');
const path = require('path');

const boxPath = path.join(__dirname, '..', '..', 'boxes.json');

function getBoxes() {
    try {
        if (fs.existsSync(boxPath)) return JSON.parse(fs.readFileSync(boxPath, 'utf8'));
    } catch (error) {}
    return {};
}

function saveBoxes(data) {
    try {
        fs.writeFileSync(boxPath, JSON.stringify(data, null, 2));
    } catch (error) {}
}

module.exports = {
    config: { name: 'box', aliases: ['inbox', 'mybox'], role: 0, description: 'Personal message box' },
    run: async ({ api, event, args }) => {
        const boxes = getBoxes();
        const userID = event.senderID;
        if (!boxes[userID]) boxes[userID] = [];

        if (args[0] === 'add' && args.length > 1) {
            boxes[userID].push(args.slice(1).join(' '));
            saveBoxes(boxes);
            api.sendMessage(`✅ Message saved to your box!`, event.threadID);
        } else if (args[0] === 'list') {
            const msgs = boxes[userID] || [];
            api.sendMessage(`📦 Your Box\n\n${msgs.map((m, i) => `${i+1}. ${m}`).join('\n') || 'Empty'}`, event.threadID);
        } else {
            api.sendMessage(`❌ Usage: /box add <message> or /box list`, event.threadID);
        }
    }
};
