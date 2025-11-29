const axios = require('axios');

module.exports = {
    config: {
        name: 'ytmp3',
        aliases: ['ytaudio', 'ytmusic'],
        role: 0,
        description: 'Download YouTube videos as MP3 audio'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a YouTube URL!\nUsage: /ytmp3 <youtube_url>', event.threadID);
        }

        const url = args[0];
        
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return api.sendMessage('❌ Invalid YouTube URL!', event.threadID);
        }

        api.sendMessage('🎵 Downloading audio...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://api.affiliateplus.xyz/api/ytdl?url=${encodeURIComponent(url)}&format=mp3`, {
                    timeout: 60000
                });

                if (response.data && response.data.downloadUrl) {
                    api.editMessage(`✅ Audio ready!\n🎵 Title: ${response.data.title || 'YouTube Audio'}\n\n🔗 Download: ${response.data.downloadUrl}`, info.messageID);
                } else {
                    api.editMessage('❌ Could not download audio. Please try again later.', info.messageID);
                }
            } catch (error) {
                console.error('YouTube MP3 download error:', error.message);
                api.editMessage('❌ Failed to download audio. Please check the URL and try again.', info.messageID);
            }
        });
    }
};
