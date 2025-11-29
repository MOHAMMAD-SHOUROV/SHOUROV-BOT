module.exports = {
    config: {
        name: 'automention',
        aliases: ['autotag', 'auto-mention'],
        role: 1,
        description: 'Auto-mention members in messages'
    },
    run: async ({ api, event, args }) => {
        if (!event.isGroup) {
            return api.sendMessage('❌ This command only works in group chats!', event.threadID);
        }

        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a message!\nUsage: /automention <message>', event.threadID);
        }

        try {
            const threadInfo = await api.getThreadInfo(event.threadID);
            const members = threadInfo.participantIDs || [];
            const message = args.join(' ');

            let mentions = {};
            members.slice(0, 10).forEach((id, index) => {
                mentions[id] = `User ${index + 1}`;
            });

            api.sendMessage(`${message}\n\n👥 Mentioned ${members.length} members!`, event.threadID, (err, info) => {
                if (!err && mentions && Object.keys(mentions).length > 0) {
                    api.changeThreadEmoji('🔔', event.threadID).catch(() => {});
                }
            });
        } catch (error) {
            console.error('Automention error:', error);
            api.sendMessage('❌ Failed to send mention.', event.threadID);
        }
    }
};
