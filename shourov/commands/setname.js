module.exports = {
    config: { name: 'setname', aliases: [], role: 1, description: 'Set name' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /setname <name>', event.threadID);
        api.sendMessage(`✅ Name set to: ${args.join(' ')}`, event.threadID);
    }
};
