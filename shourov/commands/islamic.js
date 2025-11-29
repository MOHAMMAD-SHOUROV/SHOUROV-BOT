const axios = require('axios');

module.exports = {
    config: { name: 'islamic', aliases: ['quran-verse'], role: 0, description: 'Islamic information' },
    run: async ({ api, event }) => {
        api.sendMessage('🕌 Islamic Information\n\n📖 Quran & Hadith\n\n✨ Peace be upon you', event.threadID);
    }
};
