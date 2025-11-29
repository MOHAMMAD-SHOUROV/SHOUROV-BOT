module.exports = {
    config: { name: 'join', aliases: ['welcome'], role: 0, description: 'Join message' },
    run: async ({ api, event }) => {
        api.sendMessage('🎉 Welcome to the group!\n\n👥 Join us!\n\n💬 Let\'s chat!', event.threadID);
    }
};
