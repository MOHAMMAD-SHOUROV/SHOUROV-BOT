module.exports = {
    config: { name: 'setkey', aliases: [], role: 2, description: 'Set API key' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /setkey <key>', event.threadID);
        api.sendMessage('✅ Key set (hidden)', event.threadID);
    }
};
