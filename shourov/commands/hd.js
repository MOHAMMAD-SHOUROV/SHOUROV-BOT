module.exports = {
    config: { name: 'hd', aliases: ['720p', 'quality'], role: 0, description: 'HD quality info' },
    run: async ({ api, event }) => {
        api.sendMessage('🎬 HD Quality\n\n📹 720p - High Definition\n\n✅ Best viewing experience!', event.threadID);
    }
};
