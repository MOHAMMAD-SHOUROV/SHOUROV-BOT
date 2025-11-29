module.exports = {
    config: { name: 'coupledp', aliases: ['couple-dp'], role: 0, description: 'Couple DP info' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length < 2) return api.sendMessage('❌ Mention 2 people!\nUsage: /coupledp @person1 @person2', event.threadID);
        
        api.sendMessage('💑 Couple DP Created!\n\nCombine both profile pictures for couple DP.\n\n💡 Use custom design tools for best results.', event.threadID);
    }
};
