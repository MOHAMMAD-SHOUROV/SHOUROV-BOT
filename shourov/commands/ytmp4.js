const axios = require('axios');

module.exports = {
    config: {
        name: 'ytmp4',
        aliases: ['youtube', 'ytvideo'],
        role: 0,
        description: 'Download YouTube videos in MP4 format'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a YouTube URL!\nUsage: /ytmp4 <youtube_url>', event.threadID);
        }

        const url = args[0];
        
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return api.sendMessage('❌ Invalid YouTube URL!', event.threadID);
        }

        api.sendMessage('📥 Downloading video...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://api.affiliateplus.xyz/api/ytdl?url=${encodeURIComponent(url)}&format=mp4`, {
                    timeout: 60000
                });

                if (response.data && response.data.downloadUrl) {
                    api.editMessage(`✅ Video ready!\n📹 Title: ${response.data.title || 'YouTube Video'}\n\n🔗 Download: ${response.data.downloadUrl}`, info.messageID);
                } else {
                    api.editMessage('❌ Could not download video. Please try again later.', info.messageID);
                }
            } catch (error) {
                console.error('YouTube download error:', error.message);
                api.editMessage('❌ Failed to download video. Please check the URL and try again.', info.messageID);
            }
        });
    }
};
