module.exports = {
    config: { name: 'resetmoney', aliases: [], role: 2, description: 'Reset money' },
    run: async ({ api, event }) => {
        api.sendMessage('💰 Money Reset!\n\n🏦 Back to 0', event.threadID);
    }
};
