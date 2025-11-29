const axios = require('axios');

module.exports = {
    config: {
        name: 'wiki',
        aliases: ['wikipedia'],
        role: 0,
        description: 'Search Wikipedia'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a search term!\nUsage: /wiki <search term>', event.threadID);
        }

        const query = args.join(' ');
        
        api.sendMessage('📚 Searching Wikipedia...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
                    timeout: 10000
                });

                if (response.data && response.data.extract) {
                    const wiki = response.data;
                    let message = `📚 WIKIPEDIA\n\n`;
                    message += `📖 ${wiki.title}\n\n`;
                    message += `${wiki.extract}\n\n`;
                    message += `🔗 ${wiki.content_urls?.desktop?.page || 'N/A'}`;
                    
                    api.editMessage(message, info.messageID);
                } else {
                    api.editMessage('❌ No Wikipedia article found for that term.', info.messageID);
                }
            } catch (error) {
                console.error('Wikipedia error:', error.message);
                api.editMessage('❌ Failed to search Wikipedia. Please try a different term.', info.messageID);
            }
        });
    }
};
