module.exports = {
    config: { name: 'info2', aliases: ['info-v2'], role: 0, description: 'Detailed info' },
    run: async ({ api, event }) => {
        api.sendMessage('📋 Detailed Information\n\n💡 Ask anything!\n\n🤖 I\'m here to help', event.threadID);
    }
};
