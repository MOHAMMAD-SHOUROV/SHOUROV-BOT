module.exports = {
    config: { name: 'petmonsters', aliases: ['pet-game'], role: 0, description: 'Pet monsters game' },
    run: async ({ api, event }) => {
        api.sendMessage('🎮 Pet Monsters\n\n🐾 Catch creatures!\n\n✨ Play now!', event.threadID);
    }
};
