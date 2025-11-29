module.exports = {
    config: { name: 'gist', aliases: ['code-gist'], role: 0, description: 'Code gist helper' },
    run: async ({ api, event }) => {
        api.sendMessage('📝 Code Gist\n\n💻 Share code on:\n• GitHub Gist\n• Pastebin\n• Replit\n\n🔗 Easy sharing!', event.threadID);
    }
};
