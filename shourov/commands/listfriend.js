module.exports = {
    config: { name: 'listfriend', aliases: ['friends'], role: 0, description: 'List friends' },
    run: async ({ api, event }) => {
        api.sendMessage('👥 Friends List\n\n💭 Your awesome friends!', event.threadID);
    }
};
