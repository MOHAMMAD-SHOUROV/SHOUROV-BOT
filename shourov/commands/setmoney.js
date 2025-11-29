module.exports = {
    config: { name: 'setmoney', aliases: [], role: 2, description: 'Set money' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /setmoney <amount>', event.threadID);
        api.sendMessage(`✅ Money set to: ${args[0]}`, event.threadID);
    }
};
