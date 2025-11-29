const axios = require('axios');

module.exports = {
    config: {
        name: 'lyrics',
        aliases: ['lyric', 'song'],
        role: 0,
        description: 'Search for song lyrics'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a song name!\nUsage: /lyrics <song name>', event.threadID);
        }

        const songName = args.join(' ');
        
        api.sendMessage('🎵 Searching for lyrics...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(songName.split('-')[0]?.trim() || 'artist')}/${encodeURIComponent(songName.split('-')[1]?.trim() || songName)}`, {
                    timeout: 15000
                });

                if (response.data && response.data.lyrics) {
                    const lyrics = response.data.lyrics.substring(0, 1500);
                    api.editMessage(`🎵 Lyrics for "${songName}":\n\n${lyrics}${response.data.lyrics.length > 1500 ? '\n\n... (truncated)' : ''}`, info.messageID);
                } else {
                    api.editMessage('❌ Lyrics not found. Try format: /lyrics Artist - Song Name', info.messageID);
                }
            } catch (error) {
                console.error('Lyrics error:', error.message);
                api.editMessage('❌ Failed to find lyrics. Please try format: /lyrics Artist - Song Name', info.messageID);
            }
        });
    }
};
