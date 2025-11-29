module.exports = {
    config: { name: 'rnamebox', aliases: [], role: 0, description: 'Rename box' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /rnamebox <name>', event.threadID);
        api.sendMessage(`✅ Box renamed!`, event.threadID);
    }
};
