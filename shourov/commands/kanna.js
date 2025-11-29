module.exports = {
    config: { name: 'kanna', aliases: ['anime-char'], role: 0, description: 'Anime character' },
    run: async ({ api, event }) => {
        api.sendMessage('🎌 Kanna - Dragon Maid\n\n💕 Cute anime character\n\n✨ Kawaii!', event.threadID);
    }
};
