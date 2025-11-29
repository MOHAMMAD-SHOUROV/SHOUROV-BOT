const fs = require('fs');
const path = require('path');

const rankPath = path.join(__dirname, '..', '..', 'rankings.json');

function getRankings(threadID) {
    try {
        if (fs.existsSync(rankPath)) {
            const data = JSON.parse(fs.readFileSync(rankPath, 'utf8'));
            return data[threadID] || {};
        }
    } catch (error) {
        console.error('Error reading rankings:', error);
    }
    return {};
}

function saveRankings(threadID, rankings) {
    try {
        let data = {};
        if (fs.existsSync(rankPath)) {
            data = JSON.parse(fs.readFileSync(rankPath, 'utf8'));
        }
        data[threadID] = rankings;
        fs.writeFileSync(rankPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving rankings:', error);
    }
}

module.exports = {
    config: {
        name: 'rank',
        aliases: ['ranking', 'leaderboard'],
        role: 0,
        description: 'Group message ranking system'
    },
    run: async ({ api, event }) => {
        const threadID = event.threadID;
        let rankings = getRankings(threadID);

        if (!rankings[event.senderID]) {
            rankings[event.senderID] = 0;
        }
        rankings[event.senderID]++;
        saveRankings(threadID, rankings);

        const sorted = Object.entries(rankings).sort((a, b) => b[1] - a[1]).slice(0, 10);

        let message = '🏆 GROUP RANKING - TOP 10\n\n';

        for (let i = 0; i < sorted.length; i++) {
            const [userID, count] = sorted[i];
            try {
                const userInfo = await api.getUserInfo(userID);
                const name = userInfo[userID]?.name || 'Unknown';
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                message += `${medal} ${name}: ${count} messages\n`;
            } catch (error) {
                message += `${i + 1}. User ${userID}: ${count} messages\n`;
            }
        }

        const userRank = sorted.findIndex(([id]) => id === event.senderID) + 1;
        message += `\n📊 Your rank: #${userRank} (${rankings[event.senderID]} messages)`;

        api.sendMessage(message, event.threadID);
    }
};
