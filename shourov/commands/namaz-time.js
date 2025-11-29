module.exports = {
    config: { name: 'namaz-time', aliases: ['prayer-times'], role: 0, description: 'Prayer times' },
    run: async ({ api, event }) => {
        api.sendMessage('🕌 Prayer Times\n\n⏰ Use /ajan-time for full schedule', event.threadID);
    }
};
