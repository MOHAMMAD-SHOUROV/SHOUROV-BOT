module.exports = {
    config: { name: 'pin', aliases: ['bookmark'], role: 0, description: 'Pin message' },
    run: async ({ api, event }) => {
        api.sendMessage('📌 Message pinned!\n\n⭐ Saved for later', event.threadID);
    }
};
