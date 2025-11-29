module.exports = {
    config: { name: 'penis', aliases: [], role: 2, description: '18+ restricted' },
    run: async ({ api, event }) => {
        api.sendMessage('⚠️ Inappropriate content', event.threadID);
    }
};
