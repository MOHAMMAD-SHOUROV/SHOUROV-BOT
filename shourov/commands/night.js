module.exports = {
    config: { name: 'night', aliases: ['goodnight'], role: 0, description: 'Good night message' },
    run: async ({ api, event }) => {
        api.sendMessage('🌙 Good Night!\n\n😴 Sleep tight\n\n💤 Sweet dreams!', event.threadID);
    }
};
