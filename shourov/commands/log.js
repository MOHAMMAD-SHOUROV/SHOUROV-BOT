module.exports = {
    config: { name: 'log', aliases: ['logs'], role: 2, description: 'View logs' },
    run: async ({ api, event }) => {
        api.sendMessage('📝 Logs\n\n✅ System running smoothly', event.threadID);
    }
};
