module.exports = {
    config: { name: 's', aliases: [], role: 0, description: 'Quick command' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('ℹ️ /s is a quick command', event.threadID);
        api.sendMessage(args.join(' '), event.threadID);
    }
};
