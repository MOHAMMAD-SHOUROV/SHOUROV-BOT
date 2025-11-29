const axios = require('axios');

module.exports = {
    config: {
        name: 'meme',
        aliases: ['memes', 'randommeme'],
        role: 0,
        description: 'Get random memes'
    },
    run: async ({ api, event }) => {
        api.sendMessage('😂 Fetching meme...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get('https://meme-api.com/gimme', {
                    timeout: 10000
                });

                if (response.data && response.data.url) {
                    const meme = response.data;
                    api.editMessage(`😂 ${meme.title}\n\n👤 u/${meme.author}\n⬆️ ${meme.ups} upvotes\n📱 r/${meme.subreddit}\n\n🔗 ${meme.url}`, info.messageID);
                } else {
                    api.editMessage('❌ Failed to fetch meme.', info.messageID);
                }
            } catch (error) {
                console.error('Meme error:', error.message);
                api.editMessage('❌ Failed to fetch meme. Please try again.', info.messageID);
            }
        });
    }
};
