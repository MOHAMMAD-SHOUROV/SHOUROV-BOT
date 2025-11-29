module.exports = {
    config: { name: 'setemoji', aliases: [], role: 1, description: 'Set emoji' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /setemoji <emoji>', event.threadID);
        api.sendMessage(`✅ Emoji set to: ${args[0]}`, event.threadID);
    }
};
