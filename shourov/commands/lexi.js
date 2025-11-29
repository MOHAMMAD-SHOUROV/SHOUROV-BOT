module.exports = {
    config: { name: 'lexi', aliases: ['vocabulary'], role: 0, description: 'Word definitions' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /lexi <word>', event.threadID);
        api.sendMessage(`📖 ${args[0]}\n\n💡 Look up definition online`, event.threadID);
    }
};
