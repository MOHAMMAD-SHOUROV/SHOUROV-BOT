module.exports = {
    config: { name: 'getlink', aliases: ['link', 'url'], role: 0, description: 'Get link helper' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /getlink <url>', event.threadID);
        const link = args[0];
        api.sendMessage(`🔗 Link: ${link}`, event.threadID);
    }
};
