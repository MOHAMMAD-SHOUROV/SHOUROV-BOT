module.exports = {
    config: { name: 'restart', aliases: ['reboot'], role: 2, description: 'Restart bot' },
    run: async ({ api, event }) => {
        api.sendMessage('🔄 Restarting...\n\n⏳ Please wait', event.threadID);
    }
};
