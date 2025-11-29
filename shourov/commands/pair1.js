module.exports = {
    config: { name: 'pair1', aliases: ['match-v1'], role: 0, description: 'Pair/match v1' },
    run: async ({ api, event }) => {
        api.sendMessage('👫 Pair V1\n\n💕 Finding matches...', event.threadID);
    }
};
