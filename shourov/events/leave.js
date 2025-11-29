module.exports = {
    run: async ({ event, api, config }) => {
        if (event.logMessageType === 'log:unsubscribe') {
            const leftUserID = event.logMessageData.leftParticipantFbId;
            
            if (leftUserID !== event.author) {
                try {
                    const userInfo = await api.getUserInfo(leftUserID);
                    const userName = userInfo[leftUserID]?.name || 'Member';

                    const goodbyeMessage = `
👋 Goodbye ${userName}!

They were removed from the group.

We'll miss you! 💔
                    `.trim();

                    api.sendMessage(goodbyeMessage, event.threadID);
                } catch (error) {
                    console.error('Error sending goodbye message:', error);
                }
            }
        }
    }
};
