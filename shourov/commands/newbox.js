module.exports = {
    config: { name: 'newbox', aliases: ['new-message'], role: 0, description: 'New message box' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /newbox <message>', event.threadID);
        api.sendMessage(`📬 New Box: ${args.join(' ')}`, event.threadID);
    }
};
