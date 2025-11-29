module.exports = {
    config: { name: 'pair2', aliases: ['match-v2'], role: 0, description: 'Pair/match v2' },
    run: async ({ api, event }) => {
        api.sendMessage('👫 Pair V2\n\n💕 Ultimate match!', event.threadID);
    }
};
