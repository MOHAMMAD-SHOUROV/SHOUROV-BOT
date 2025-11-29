module.exports = {
    config: { name: 'pantiesclosev2', aliases: [], role: 2, description: '18+ restricted v2' },
    run: async ({ api, event }) => {
        api.sendMessage('⚠️ Restricted content', event.threadID);
    }
};
