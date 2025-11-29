module.exports = {
    config: {
        name: 'baby',
        aliases: ['cute', 'adorable'],
        role: 0,
        description: 'Generate cute/baby quotes'
    },
    run: async ({ api, event }) => {
        const quotes = [
            '👶 You\'re as cute as a button!',
            '🍼 Baby, you\'re adorable!',
            '💕 Sweet as sugar!',
            '🌟 You\'re one in a million!',
            '😍 Cuteness overload!',
            '👼 Precious little one!',
            '🎀 Absolutely precious!',
            '💖 Heart melting cuteness!'
        ];

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        api.sendMessage(randomQuote, event.threadID);
    }
};
