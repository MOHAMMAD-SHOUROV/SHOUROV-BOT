module.exports = {
    config: { name: 'setprefix', aliases: [], role: 2, description: 'Set prefix' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /setprefix <char>', event.threadID);
        api.sendMessage(`✅ Prefix set to: ${args[0]}`, event.threadID);
    }
};
