module.exports = {
    config: { name: 'pic', aliases: ['picture', 'image'], role: 0, description: 'Show picture' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /pic <search term>', event.threadID);
        api.sendMessage(`🖼️ Picture: ${args.join(' ')}`, event.threadID);
    }
};
