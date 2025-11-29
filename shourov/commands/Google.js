const axios = require('axios');

module.exports = {
    config: {
        name: 'google',
        aliases: ['search', 'find'],
        role: 0,
        description: 'Search Google'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a search query!\nUsage: /google <search term>', event.threadID);
        }

        const query = args.join(' ');
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

        api.sendMessage(`🔍 Google Search Results\n\n📝 Query: ${query}\n\n🔗 View results: ${searchUrl}\n\n💡 Tip: Click the link to see full search results`, event.threadID);
    }
};
