module.exports = {
    config: { name: 'hug', aliases: ['embrace'], role: 0, description: 'Send a hug' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('🤗 Have a hug!\n\n💕 You\'re amazing!', event.threadID);
        const name = event.mentions[mentions[0]].replace('@', '');
        api.sendMessage(`🤗 ${name} gets a big hug!\n\n💕 Love you!`, event.threadID);
    }
};
