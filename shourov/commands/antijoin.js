const fs = require('fs');
const path = require('path');

const antijoinPath = path.join(__dirname, '..', '..', 'antijoin.json');

function getAntijoinList() {
    try {
        if (fs.existsSync(antijoinPath)) {
            return JSON.parse(fs.readFileSync(antijoinPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading antijoin list:', error);
    }
    return [];
}

function saveAntijoinList(list) {
    try {
        fs.writeFileSync(antijoinPath, JSON.stringify(list, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving antijoin list:', error);
        return false;
    }
}

module.exports = {
    config: {
        name: 'antijoin',
        aliases: ['blockjoin', 'nojoin'],
        role: 1,
        description: 'Prevent new members from joining'
    },
    run: async ({ api, event }) => {
        const antijoinList = getAntijoinList();
        const threadID = event.threadID;

        if (antijoinList.includes(threadID)) {
            const index = antijoinList.indexOf(threadID);
            antijoinList.splice(index, 1);
            saveAntijoinList(antijoinList);
            api.sendMessage('✅ Anti-join disabled! New members can join now.', threadID);
        } else {
            antijoinList.push(threadID);
            saveAntijoinList(antijoinList);
            api.sendMessage('🔒 Anti-join enabled! New members will be kicked.', threadID);
        }
    }
};
