module.exports = {
    config: { name: 'minari', aliases: ['character'], role: 0, description: 'Character reference' },
    run: async ({ api, event }) => {
        api.sendMessage('🎌 Minari - Anime Character\n\n✨ Popular & Loved!', event.threadID);
    }
};
