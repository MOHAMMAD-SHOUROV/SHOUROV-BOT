module.exports = {
    config: { name: 'listadmin', aliases: ['admin-list-v2'], role: 0, description: 'List admins' },
    run: async ({ api, event }) => {
        if (!event.isGroup) return api.sendMessage('❌ Group only!', event.threadID);
        try {
            const threadInfo = await api.getThreadInfo(event.threadID);
            const adminCount = threadInfo.adminIDs.length;
            api.sendMessage(`👮 ${adminCount} Admin(s)`, event.threadID);
        } catch (error) {
            api.sendMessage('❌ Error', event.threadID);
        }
    }
};
