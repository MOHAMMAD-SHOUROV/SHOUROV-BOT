module.exports = {
    config: { name: 'groupemoji', aliases: ['emoji-group'], role: 1, description: 'Set group emoji' },
    run: async ({ api, event, args }) => {
        if (!event.isGroup) return api.sendMessage('❌ Group only!', event.threadID);
        const emoji = args[0] || '😀';
        try {
            await api.changeThreadEmoji(emoji, event.threadID);
            api.sendMessage(`✅ Group emoji changed to ${emoji}`, event.threadID);
        } catch (error) {
            api.sendMessage('❌ Failed to change emoji', event.threadID);
        }
    }
};
