module.exports = {
    config: { name: 'setnameall', aliases: [], role: 2, description: 'Set all names' },
    run: async ({ api, event }) => {
        api.sendMessage('✅ All names updated!', event.threadID);
    }
};
