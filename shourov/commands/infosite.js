module.exports = {
    config: { name: 'infosite', aliases: ['site-info'], role: 0, description: 'Website information' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /infosite <url>', event.threadID);
        const url = args[0];
        api.sendMessage(`🌐 Site: ${url}`, event.threadID);
    }
};
