module.exports = {
    run: async ({ event, api, config }) => {
        if (event.logMessageType === 'log:unsubscribe') {
            if (event.logMessageData.leftParticipantFbId === event.author) {
                const leftUserID = event.logMessageData.leftParticipantFbId;
                const botID = api.getCurrentUserID();

                if (leftUserID === botID) {
                    return;
                }

                if (leftUserID === config.ownerId) {
                    return;
                }

                try {
                    await api.addUserToGroup(leftUserID, event.threadID);
                    api.sendMessage(
                        `🔒 Auto re-add activated!\nUser was automatically added back to the group.`,
                        event.threadID
                    );
                } catch (error) {
                    console.error('Error re-adding user:', error);
                    api.sendMessage(
                        `⚠️ Failed to re-add user. They may have blocked the bot or left intentionally.`,
                        event.threadID
                    );
                }
            }
        }
    }
};
