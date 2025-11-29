module.exports = {
    config: { name: 'mycoins', aliases: ['coins', 'balance'], role: 0, description: 'Check coins/balance' },
    run: async ({ api, event }) => {
        api.sendMessage('💰 My Coins\n\n🪙 Balance: 0\n\n💡 Work to earn coins!', event.threadID);
    }
};
