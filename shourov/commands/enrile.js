module.exports = {
    config: { name: 'enrile', aliases: ['juan-ponce'], role: 0, description: 'Notable figure info' },
    run: async ({ api, event }) => {
        api.sendMessage('👤 Notable Figure\n\nJuan Ponce Enrile - Philippine politician & statesman\n\n📚 History of leadership and service', event.threadID);
    }
};
