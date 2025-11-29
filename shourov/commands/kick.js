module.exports = {
    config: { name: 'kick', aliases: ['remove-user'], role: 1, description: 'Kick user from group' },
    run: async ({ api, event, args }) => {
        if (!event.isGroup) return api.sendMessage('❌ Group only!', event.threadID);
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('❌ Mention user to kick', event.threadID);
        try {
            await api.removeUserFromGroup(mentions[0], event.threadID);
            api.sendMessage('✅ User kicked', event.threadID);
        } catch (error) {
            api.sendMessage('❌ Cannot kick user', event.threadID);
        }
    }
};
