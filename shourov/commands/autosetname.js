module.exports = {
    config: {
        name: 'autosetname',
        aliases: ['auto-name', 'setname-auto'],
        role: 2,
        description: 'Set automatic group name changes'
    },
    run: async ({ api, event, args }) => {
        if (!event.isGroup) {
            return api.sendMessage('❌ This command only works in group chats!', event.threadID);
        }

        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a group name!\nUsage: /autosetname <name>', event.threadID);
        }

        const newName = args.join(' ');

        try {
            await api.setTitle(newName, event.threadID);
            api.sendMessage(`✅ Group name changed to: ${newName}`, event.threadID);
        } catch (error) {
            console.error('Autosetname error:', error);
            api.sendMessage('❌ Failed to change group name. Make sure bot is admin!', event.threadID);
        }
    }
};
