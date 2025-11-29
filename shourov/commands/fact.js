const axios = require('axios');

module.exports = {
    config: { name: 'fact', aliases: ['random-fact', 'trivia'], role: 0, description: 'Random interesting fact' },
    run: async ({ api, event }) => {
        api.sendMessage('📚 Fetching fact...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get('https://uselessfacts.jsph.pl/random.json', { timeout: 5000 });
                api.editMessage(`📚 Random Fact\n\n${response.data.text}`, info.messageID);
            } catch (error) {
                api.editMessage('❌ Could not fetch fact.', info.messageID);
            }
        });
    }
};
