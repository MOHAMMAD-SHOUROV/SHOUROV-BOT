module.exports = {
    config: {
        name: 'out',
        aliases: ['leave', 'goodbye'],
        role: 2,
        description: 'Make bot leave the group'
    },
    run: async ({ api, event, config }) => {
        if (!event.isGroup) {
            return api.sendMessage('❌ This command only works in group chats!', event.threadID);
        }

        api.sendMessage(`👋 Goodbye everyone!\n\nBot is leaving as requested by the owner.\n\n- ${config.botName}`, event.threadID, () => {
            setTimeout(() => {
                api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
            }, 2000);
        });
    }
};
