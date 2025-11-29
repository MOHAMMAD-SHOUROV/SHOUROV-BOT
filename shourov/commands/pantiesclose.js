module.exports = {
    config: { name: 'pantiesclose', aliases: [], role: 2, description: '18+ restricted' },
    run: async ({ api, event }) => {
        api.sendMessage('⚠️ Restricted content', event.threadID);
    }
};
