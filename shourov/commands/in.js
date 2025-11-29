module.exports = {
    config: { name: 'in', aliases: ['enter', 'join'], role: 0, description: 'Join notification' },
    run: async ({ api, event }) => {
        api.sendMessage('👋 Someone joined!\n\n🎉 Welcome!', event.threadID);
    }
};
