module.exports = {
    config: { name: 'sendnoti2', aliases: [], role: 2, description: 'Send notification v2' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /sendnoti2 <message>', event.threadID);
        api.sendMessage(`📢 ${args.join(' ')}`, event.threadID);
    }
};
