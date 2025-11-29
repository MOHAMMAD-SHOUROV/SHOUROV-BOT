module.exports = {
    config: { name: 'mbbank', aliases: ['banking'], role: 0, description: 'Banking info' },
    run: async ({ api, event }) => {
        api.sendMessage('🏦 MB Bank\n\n💳 Digital Banking\n💰 Secure Transactions\n\n✅ Safe & Easy!', event.threadID);
    }
};
