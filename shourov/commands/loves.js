module.exports = {
    config: { name: 'loves', aliases: ['love-list'], role: 0, description: 'Love statistics' },
    run: async ({ api, event }) => {
        api.sendMessage('💕 Love Stats\n\n❤️ Total love: ∞\n\n😘 Spread the love!', event.threadID);
    }
};
