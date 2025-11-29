module.exports = {
    config: { name: 'salam', aliases: ['assalamualaikum', 'peace'], role: 0, description: 'Islamic greeting' },
    run: async ({ api, event }) => {
        api.sendMessage('🕌 Assalamu Alaikum wa Rahmatullahi wa Barakatuh\n\n☮️ Peace be upon you', event.threadID);
    }
};
