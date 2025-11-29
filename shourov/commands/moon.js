module.exports = {
    config: { name: 'moon', aliases: ['lunar'], role: 0, description: 'Moon information' },
    run: async ({ api, event }) => {
        api.sendMessage('🌙 Moon Information\n\n✨ Beautiful night sky\n🌟 Peaceful vibes', event.threadID);
    }
};
