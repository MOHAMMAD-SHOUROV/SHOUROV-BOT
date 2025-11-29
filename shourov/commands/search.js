module.exports = {
    config: { name: 'search', aliases: ['find'], role: 0, description: 'Search command' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /search <query>', event.threadID);
        api.sendMessage(`🔍 Searching: ${args.join(' ')}`, event.threadID);
    }
};
