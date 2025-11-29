module.exports = {
    run: async ({ event, api, config }) => {
        if (event.logMessageType === 'log:subscribe') {
            const { addedParticipants } = event.logMessageData;
            
            for (const participant of addedParticipants) {
                const userID = participant.userFbId;
                
                try {
                    const userInfo = await api.getUserInfo(userID);
                    const userName = userInfo[userID]?.name || 'New Member';

                    const welcomeMessage = `
🎉 Welcome to the group!

👋 Hello ${userName}!

I'm ${config.botName}, your friendly group assistant.

📌 Prefix: ${config.prefix}
💡 Type ${config.prefix}help to see all available commands.

Enjoy your stay! 🌟
                    `.trim();

                    api.sendMessage(welcomeMessage, event.threadID);
                } catch (error) {
                    console.error('Error sending welcome message:', error);
                }
            }
        }
    }
};
