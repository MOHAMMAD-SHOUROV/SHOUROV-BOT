const axios = require('axios');

module.exports = {
    config: {
        name: 'animegirl',
        aliases: ['waifu', 'anime-girl'],
        role: 0,
        description: 'Get random anime girl images'
    },
    run: async ({ api, event }) => {
        api.sendMessage('🎌 Fetching anime girl...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get('https://api.waifu.pics/sfw/waifu', { timeout: 10000 });
                
                if (response.data && response.data.url) {
                    api.editMessage(`🎌 Random Anime Girl!\n\n🔗 ${response.data.url}`, info.messageID);
                } else {
                    api.editMessage('❌ Failed to fetch image.', info.messageID);
                }
            } catch (error) {
                console.error('Animegirl error:', error.message);
                api.editMessage('❌ Failed to fetch anime image. Please try again.', info.messageID);
            }
        });
    }
};
