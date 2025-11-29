module.exports = {
    config: { name: 'setjoin', aliases: [], role: 1, description: 'Set join message' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /setjoin <message>', event.threadID);
        api.sendMessage(`✅ Join message set!`, event.threadID);
    }
};
