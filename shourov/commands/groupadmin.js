module.exports = {
    config: { name: 'groupadmin', aliases: ['ga', 'admin-list'], role: 0, description: 'List group admins' },
    run: async ({ api, event }) => {
        if (!event.isGroup) return api.sendMessage('❌ Group only!', event.threadID);
        try {
            const threadInfo = await api.getThreadInfo(event.threadID);
            const admins = threadInfo.adminIDs.map(a => a.id);
            api.sendMessage(`👮 Group Admins: ${admins.length}\n\n${admins.map((id, i) => `${i+1}. ${id}`).join('\n')}`, event.threadID);
        } catch (error) {
            api.sendMessage('❌ Error fetching admins', event.threadID);
        }
    }
};
