module.exports = {
    config: { name: 'fbcover', aliases: ['cover-photo', 'facebook-cover'], role: 0, description: 'Facebook cover photo' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /fbcover <phrase>\n\n💡 Creates text for cover', event.threadID);
        const text = args.join(' ');
        api.sendMessage(`📸 Facebook Cover\n\n${text}\n\n💡 Use as cover photo text`, event.threadID);
    }
};
