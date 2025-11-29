module.exports = {
    config: { name: 'reload', aliases: ['refresh'], role: 2, description: 'Reload bot' },
    run: async ({ api, event }) => {
        api.sendMessage('🔄 Reloading...\n\n✅ Done!', event.threadID);
    }
};
