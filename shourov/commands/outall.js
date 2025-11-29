module.exports = {
    config: { name: 'outall', aliases: ['out-all'], role: 2, description: 'Out from all groups' },
    run: async ({ api, event }) => {
        api.sendMessage('⚠️ This would leave all groups.\n\n💡 Are you sure?', event.threadID);
    }
};
