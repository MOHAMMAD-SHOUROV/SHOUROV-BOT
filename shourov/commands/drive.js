module.exports = {
    config: { name: 'drive', aliases: ['gdrive', 'google-drive'], role: 0, description: 'Google Drive helper' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('📁 Google Drive\n\n🔗 Open: https://drive.google.com\n💡 Use web for full functionality', event.threadID);
        api.sendMessage('📁 Google Drive Share\n\n🔗 Share link to group members', event.threadID);
    }
};
