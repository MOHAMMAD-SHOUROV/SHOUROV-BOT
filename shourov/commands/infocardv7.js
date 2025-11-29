module.exports = {
    config: { name: 'infocardv7', aliases: ['infocard-v7'], role: 0, description: 'Info card v7' },
    run: async ({ api, event }) => {
        api.sendMessage('📇 Info Card V7\n\n🎯 Advanced information display', event.threadID);
    }
};
