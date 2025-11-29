module.exports = {
    config: { name: 'rules', aliases: ['group-rules'], role: 0, description: 'Full rules list' },
    run: async ({ api, event }) => {
        api.sendMessage('📖 Complete Rules:\n\n✅ Follow group guidelines', event.threadID);
    }
};
