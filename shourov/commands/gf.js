module.exports = {
    config: { name: 'gf', aliases: ['girlfriend', 'love'], role: 0, description: 'Girlfriend mode' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('💕 Looking for love!\n\n❤️ Single and ready to mingle!', event.threadID);
        const name = event.mentions[mentions[0]].replace('@', '');
        api.sendMessage(`💕 ${name}\n\n❤️ My girlfriend!\n\n😘 Forever yours!`, event.threadID);
    }
};
