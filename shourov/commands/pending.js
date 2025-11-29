module.exports = {
    config: { name: 'pending', aliases: ['wait'], role: 0, description: 'Pending status' },
    run: async ({ api, event }) => {
        api.sendMessage('⏳ Pending...\n\n⌛ Please wait', event.threadID);
    }
};
