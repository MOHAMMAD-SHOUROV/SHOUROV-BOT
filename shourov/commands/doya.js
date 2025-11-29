module.exports = {
    config: { name: 'doya', aliases: ['attitude'], role: 0, description: 'Attitude/sass message' },
    run: async ({ api, event }) => {
        const sass = ['💅 I\'m fabulous!', '😎 Too cool!', '👑 I\'m royalty!', '🔥 Hot!'];
        api.sendMessage(sass[Math.floor(Math.random() * sass.length)], event.threadID);
    }
};
