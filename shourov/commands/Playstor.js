module.exports = {
    config: {
        name: 'playstor',
        aliases: ['playstore', 'app'],
        role: 0,
        description: 'Search Google Play Store'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide an app name!\nUsage: /playstor <app name>', event.threadID);
        }

        const appName = args.join(' ');
        const searchUrl = `https://play.google.com/store/search?q=${encodeURIComponent(appName)}&c=apps`;

        api.sendMessage(`📱 Play Store Search\n\n🔍 Searching for: ${appName}\n\n🔗 View results: ${searchUrl}`, event.threadID);
    }
};
