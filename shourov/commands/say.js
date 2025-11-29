module.exports = {
    config: { name: 'say', aliases: ['echo'], role: 0, description: 'Echo message' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /say <text>', event.threadID);
        api.sendMessage(args.join(' '), event.threadID);
    }
};
