module.exports = {
    config: { name: 'hot', aliases: ['trending', 'popular'], role: 0, description: 'Hot/trending content' },
    run: async ({ api, event }) => {
        api.sendMessage('🔥 Hot Content\n\n🎬 Check trending videos\n📺 Popular streams\n\n💪 Stay updated!', event.threadID);
    }
};
