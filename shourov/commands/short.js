const axios = require('axios');

module.exports = {
    config: {
        name: 'short',
        aliases: ['shorten', 'tinyurl'],
        role: 0,
        description: 'Shorten long URLs'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a URL to shorten!\nUsage: /short <url>', event.threadID);
        }

        const url = args[0];
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return api.sendMessage('❌ Please provide a valid URL starting with http:// or https://', event.threadID);
        }

        api.sendMessage('🔗 Shortening URL...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
                    timeout: 10000
                });

                if (response.data) {
                    api.editMessage(`✅ URL Shortened!\n\n🔗 Original: ${url}\n\n✂️ Short: ${response.data}`, info.messageID);
                } else {
                    api.editMessage('❌ Failed to shorten URL.', info.messageID);
                }
            } catch (error) {
                console.error('URL shortener error:', error.message);
                api.editMessage('❌ Failed to shorten URL. Please check if the URL is valid.', info.messageID);
            }
        });
    }
};
