module.exports = {
    config: { name: 'fbget', aliases: ['fb-get', 'getfb'], role: 0, description: 'Get Facebook info' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /fbget <url or username>', event.threadID);
        api.sendMessage('🔍 Fetching Facebook info...\n\n💡 Share profile link for more details', event.threadID);
    }
};
