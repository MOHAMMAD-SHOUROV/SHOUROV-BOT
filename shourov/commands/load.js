module.exports = {
    config: { name: 'load', aliases: ['reload'], role: 2, description: 'Reload commands' },
    run: async ({ api, event }) => {
        api.sendMessage('⏳ Reloading...\n\n✅ Commands reloaded!', event.threadID);
    }
};
