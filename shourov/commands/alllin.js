module.exports = {
    config: {
        name: 'alllin',
        aliases: ['online', 'all-online'],
        role: 0,
        description: 'Show all online members'
    },
    run: async ({ api, event }) => {
        if (!event.isGroup) {
            return api.sendMessage('❌ This command only works in group chats!', event.threadID);
        }

        try {
            const threadInfo = await api.getThreadInfo(event.threadID);
            const members = threadInfo.participantIDs || [];
            
            api.sendMessage(`👥 Total Members: ${members.length}\n\n💡 Use /groupinfo for detailed analytics`, event.threadID);
        } catch (error) {
            console.error('Alllin error:', error);
            api.sendMessage('❌ Failed to fetch member list.', event.threadID);
        }
    }
};
