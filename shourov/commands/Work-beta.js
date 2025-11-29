const fs = require('fs');
const path = require('path');

const workPath = path.join(__dirname, '..', '..', 'workdata.json');

function getWorkData() {
    try {
        if (fs.existsSync(workPath)) {
            return JSON.parse(fs.readFileSync(workPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading work data:', error);
    }
    return {};
}

function saveWorkData(data) {
    try {
        fs.writeFileSync(workPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving work data:', error);
        return false;
    }
}

module.exports = {
    config: {
        name: 'work-beta',
        aliases: ['work', 'job'],
        role: 0,
        description: 'Work to earn virtual coins (Beta version)'
    },
    run: async ({ api, event }) => {
        const workData = getWorkData();
        const userID = event.senderID;
        const now = Date.now();
        const cooldown = 3600000;

        if (!workData[userID]) {
            workData[userID] = { lastWork: 0, earnings: 0 };
        }

        const timeSinceLastWork = now - workData[userID].lastWork;

        if (timeSinceLastWork < cooldown) {
            const remainingTime = Math.ceil((cooldown - timeSinceLastWork) / 60000);
            return api.sendMessage(`⏰ You already worked recently!\n\n⏳ Wait ${remainingTime} minutes before working again.`, event.threadID);
        }

        const jobs = [
            { name: 'Developer', emoji: '💻', min: 500, max: 1000 },
            { name: 'Teacher', emoji: '👨‍🏫', min: 300, max: 700 },
            { name: 'Doctor', emoji: '👨‍⚕️', min: 600, max: 1200 },
            { name: 'Chef', emoji: '👨‍🍳', min: 200, max: 500 },
            { name: 'Artist', emoji: '🎨', min: 250, max: 600 },
            { name: 'Engineer', emoji: '⚙️', min: 450, max: 900 }
        ];

        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

        workData[userID].lastWork = now;
        workData[userID].earnings += earned;
        saveWorkData(workData);

        api.sendMessage(`💼 Work Complete!\n\n${job.emoji} Job: ${job.name}\n💰 Earned: ${earned} coins\n📊 Total Earnings: ${workData[userID].earnings} coins\n\n⏱️ Come back in 1 hour to work again!`, event.threadID);
    }
};
