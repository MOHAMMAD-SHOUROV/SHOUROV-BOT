module.exports = {
    config: { name: 'nhentai', aliases: ['nh'], role: 2, description: '18+ content (restricted)' },
    run: async ({ api, event }) => {
        api.sendMessage('⚠️ This command is restricted.\n\n🔞 18+ Content\n\nNot appropriate for group chat.', event.threadID);
    }
};
