module.exports = {
    config: { name: 'selfadmin', aliases: [], role: 2, description: 'Self admin' },
    run: async ({ api, event }) => {
        api.sendMessage('✅ Self Admin Mode Active', event.threadID);
    }
};
