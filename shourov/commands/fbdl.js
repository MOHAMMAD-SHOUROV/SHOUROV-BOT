const axios = require('axios');

module.exports = {
    config: {
        name: 'fbdl',
        aliases: ['facebook', 'fbdownload'],
        role: 0,
        description: 'Download Facebook videos'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a Facebook video URL!\nUsage: /fbdl <facebook_video_url>', event.threadID);
        }

        const url = args[0];
        
        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            return api.sendMessage('❌ Invalid Facebook URL!', event.threadID);
        }

        api.sendMessage('📥 Downloading video...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://api.affiliateplus.xyz/api/fbdl?url=${encodeURIComponent(url)}`, {
                    timeout: 60000
                });

                if (response.data && response.data.videoUrl) {
                    api.editMessage(`✅ Video downloaded!\n📹 Title: ${response.data.title || 'Facebook Video'}\n\n🔗 Download: ${response.data.videoUrl}`, info.messageID);
                } else {
                    api.editMessage('❌ Could not download video. Please check the URL and try again.', info.messageID);
                }
            } catch (error) {
                console.error('Facebook download error:', error.message);
                api.editMessage('❌ Failed to download video. The video might be private or the URL is invalid.', info.messageID);
            }
        });
    }
};
