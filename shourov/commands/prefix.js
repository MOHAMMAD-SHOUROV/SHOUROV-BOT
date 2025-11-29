module.exports = {
    config: { name: 'prefix', aliases: ['cmd-prefix'], role: 2, description: 'Change prefix' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /prefix <symbol>', event.threadID);
        api.sendMessage(`✅ Prefix changed to: ${args[0]}`, event.threadID);
    }
};
