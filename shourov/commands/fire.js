module.exports = {
    config: { name: 'fire', aliases: ['lit', 'hot'], role: 0, description: 'Fire/hot emojis' },
    run: async ({ api, event }) => {
        api.sendMessage('🔥 FIRE 🔥\n\n🔥🔥🔥\n🔥   🔥\n🔥🔥🔥\n\n💯 Hot stuff!', event.threadID);
    }
};
