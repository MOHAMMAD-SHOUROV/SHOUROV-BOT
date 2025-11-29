module.exports = {
    config: { name: 'mention', aliases: ['tag', 'mention-all'], role: 0, description: 'Mention someone' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('❌ Mention someone!', event.threadID);
        api.sendMessage(`📢 Mentioned!`, event.threadID);
    }
};
