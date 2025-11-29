module.exports = {
    config: { name: 'rankup', aliases: ['level-up'], role: 0, description: 'Rank up' },
    run: async ({ api, event }) => {
        api.sendMessage('⬆️ Rank Up!\n\n🎉 Promotion!\n\n⭐ Level +1', event.threadID);
    }
};
