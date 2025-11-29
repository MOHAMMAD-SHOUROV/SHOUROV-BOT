module.exports = {
    config: { name: 'imgur', aliases: ['imgr'], role: 0, description: 'Imgur image helper' },
    run: async ({ api, event }) => {
        api.sendMessage('🖼️ Imgur\n\n📸 Upload & share images\n\n🔗 https://imgur.com', event.threadID);
    }
};
