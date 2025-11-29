module.exports = {
    run: async ({ event, api, config }) => {
        const logTypes = {
            'log:subscribe': '👥 User joined',
            'log:unsubscribe': '👋 User left',
            'log:thread-name': '✏️ Group name changed',
            'log:thread-color': '🎨 Theme changed',
            'log:thread-icon': '😀 Emoji changed',
            'log:user-nickname': '📝 Nickname changed'
        };

        if (logTypes[event.logMessageType]) {
            console.log(`[EVENT] ${logTypes[event.logMessageType]} in thread ${event.threadID}`);
        }

        if (event.type === 'message' && event.body && event.body.startsWith(config.prefix)) {
            const command = event.body.split(' ')[0].slice(config.prefix.length);
            console.log(`[COMMAND] /${command} executed by ${event.senderID} in thread ${event.threadID}`);
        }
    }
};
