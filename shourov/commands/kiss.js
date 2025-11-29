module.exports = {
    config: { name: 'kiss', aliases: ['smooch'], role: 0, description: 'Send a kiss' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('😘 Mwah! Kiss!', event.threadID);
        const name = event.mentions[mentions[0]].replace('@', '');
        api.sendMessage(`😘 ${name} gets a kiss!\n\n💋 Smooch!`, event.threadID);
    }
};
