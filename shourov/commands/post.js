module.exports = {
    config: { name: 'post', aliases: ['share'], role: 0, description: 'Post message' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /post <message>', event.threadID);
        api.sendMessage(`📢 ${args.join(' ')}`, event.threadID);
    }
};
