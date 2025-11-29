module.exports = {
    config: { name: 'music', aliases: ['song', 'track'], role: 0, description: 'Music player' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /music <song name>', event.threadID);
        api.sendMessage(`🎵 Now Playing: ${args.join(' ')}\n\n🎧 Enjoy!`, event.threadID);
    }
};
