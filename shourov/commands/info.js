module.exports = {
    config: { name: 'info', aliases: ['information'], role: 0, description: 'General information' },
    run: async ({ api, event }) => {
        api.sendMessage('ℹ️ Information Request\n\n📚 What would you like to know?', event.threadID);
    }
};
