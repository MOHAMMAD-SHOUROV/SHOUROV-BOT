module.exports = {
    config: {
        name: 'rushi',
        aliases: ['rush', 'hurry'],
        role: 0,
        description: 'Fun rush/hurry command'
    },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        
        if (mentions.length === 0) {
            return api.sendMessage('🏃‍♂️💨 Rushing!\n\nZoom zoom! Gotta go fast! ⚡', event.threadID);
        }

        const targetID = mentions[0];
        const targetName = event.mentions[targetID].replace('@', '');

        const rushMessages = [
            `🏃‍♂️💨 ${targetName} is rushing like crazy!`,
            `⚡ ${targetName} zoomed past everyone!`,
            `🏎️💨 ${targetName} activated speed mode!`,
            `🚀 ${targetName} is going at light speed!`,
            `⏰ ${targetName} has no time to waste!`
        ];

        const message = rushMessages[Math.floor(Math.random() * rushMessages.length)];
        api.sendMessage(message, event.threadID);
    }
};
