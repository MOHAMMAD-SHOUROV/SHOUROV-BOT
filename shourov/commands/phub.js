module.exports = {
    config: { name: 'phub', aliases: [], role: 2, description: '18+ restricted' },
    run: async ({ api, event }) => {
        api.sendMessage('⚠️ Adult content not allowed', event.threadID);
    }
};
