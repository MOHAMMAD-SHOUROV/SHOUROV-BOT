module.exports = {
    config: { name: 'rnamebot', aliases: [], role: 2, description: 'Rename bot' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /rnamebot <name>', event.threadID);
        api.sendMessage(`✅ Bot renamed to: ${args.join(' ')}`, event.threadID);
    }
};
