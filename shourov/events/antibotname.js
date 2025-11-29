module.exports = {
    run: async ({ event, api, config }) => {
        if (event.logMessageType === 'log:thread-name') {
            const changerID = event.author;
            
            if (changerID === config.ownerId) {
                return;
            }

            try {
                const threadInfo = await api.getThreadInfo(event.threadID);
                const botID = api.getCurrentUserID();
                
                api.sendMessage(
                    `⚠️ Unauthorized attempt to change group name!\nOnly the owner can modify group settings.`,
                    event.threadID
                );

                if (event.logMessageData.name) {
                    api.setTitle(event.logMessageData.name, event.threadID);
                }
            } catch (error) {
                console.error('Error in antibotname:', error);
            }
        }
    }
};
