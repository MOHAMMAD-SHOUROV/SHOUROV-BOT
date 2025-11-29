module.exports = {
    config: { name: 'fyoutoo', aliases: ['fyou', 'mock'], role: 0, description: 'Sarcastic response' },
    run: async ({ api, event }) => {
        const responses = [
            '😏 Right back at you!',
            '🙄 That\'s cool, I guess',
            '😒 Interesting perspective'
        ];
        api.sendMessage(responses[Math.floor(Math.random() * responses.length)], event.threadID);
    }
};
