module.exports = {
    config: { name: 'resetexp', aliases: [], role: 2, description: 'Reset XP' },
    run: async ({ api, event }) => {
        api.sendMessage('🔄 XP Reset!\n\n📊 Back to 0', event.threadID);
    }
};
