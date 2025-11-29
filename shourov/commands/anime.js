const axios = require('axios');

module.exports = {
    config: {
        name: 'anime',
        aliases: ['animepic', 'waifu'],
        role: 0,
        description: 'Get random anime images'
    },
    run: async ({ api, event }) => {
        api.sendMessage('🎌 Fetching anime image...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get('https://api.waifu.pics/sfw/waifu', {
                    timeout: 10000
                });

                if (response.data && response.data.url) {
                    api.editMessage(`🎌 Random Anime Image!\n\n🔗 ${response.data.url}`, info.messageID);
                } else {
                    api.editMessage('❌ Failed to fetch anime image.', info.messageID);
                }
            } catch (error) {
                console.error('Anime error:', error.message);
                api.editMessage('❌ Failed to fetch anime image. Please try again.', info.messageID);
            }
        });
    }
};
