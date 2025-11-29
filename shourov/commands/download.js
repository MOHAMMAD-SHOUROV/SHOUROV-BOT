module.exports = {
    config: { name: 'download', aliases: ['dl', 'get-file'], role: 0, description: 'Download helper' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /download <url>\n\n💡 Available:\n/fbdl - Facebook\n/ytmp4 - YouTube MP4\n/ytmp3 - YouTube MP3', event.threadID);
        
        api.sendMessage('💾 Download feature requires specific command.\n\n📥 Try: /fbdl, /ytmp4, /ytmp3', event.threadID);
    }
};
