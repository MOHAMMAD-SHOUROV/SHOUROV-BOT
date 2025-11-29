module.exports = {
    config: { name: 'sendnoti', aliases: [], role: 2, description: 'Send notification' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /sendnoti <message>', event.threadID);
        api.sendMessage(`🔔 ${args.join(' ')}`, event.threadID);
    }
};
