module.exports = {
    run: async ({ event, api, config }) => {
        if (event.logMessageType === 'log:thread-color' || 
            event.logMessageType === 'log:thread-icon') {
            
            const changerID = event.author;
            
            if (changerID === config.ownerId) {
                return;
            }

            try {
                api.sendMessage(
                    `⚠️ Unauthorized attempt to change group ${event.logMessageType.includes('color') ? 'theme' : 'emoji'}!\nOnly the owner can modify group settings.`,
                    event.threadID
                );
            } catch (error) {
                console.error('Error in antichangeinfogroup:', error);
            }
        }
    }
};
