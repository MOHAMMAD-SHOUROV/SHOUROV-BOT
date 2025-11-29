module.exports = {
    config: { name: 'groupname', aliases: ['gname'], role: 1, description: 'Get/set group name' },
    run: async ({ api, event, args }) => {
        if (!event.isGroup) return api.sendMessage('❌ Group only!', event.threadID);
        if (args.length > 0) {
            const newName = args.join(' ');
            try {
                await api.setTitle(newName, event.threadID);
                api.sendMessage(`✅ Group name changed to: ${newName}`, event.threadID);
            } catch (error) {
                api.sendMessage('❌ Failed', event.threadID);
            }
        } else {
            try {
                const threadInfo = await api.getThreadInfo(event.threadID);
                api.sendMessage(`📝 Group: ${threadInfo.threadName}`, event.threadID);
            } catch (error) {
                api.sendMessage('❌ Error', event.threadID);
            }
        }
    }
};
