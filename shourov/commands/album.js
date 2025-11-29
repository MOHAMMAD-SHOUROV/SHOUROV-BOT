const axios = require('axios');

module.exports = {
    config: {
        name: 'album',
        aliases: ['music-album', 'discography'],
        role: 0,
        description: 'Search for music albums'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide an album or artist name!\nUsage: /album <album/artist name>', event.threadID);
        }

        const query = args.join(' ');
        const searchUrl = `https://music.youtube.com/search?q=${encodeURIComponent(query + ' album')}`;

        api.sendMessage(`🎵 Music Album Search\n\n🔍 Searching for: ${query}\n\n🔗 View results: ${searchUrl}\n\n💡 This will open YouTube Music`, event.threadID);
    }
};
