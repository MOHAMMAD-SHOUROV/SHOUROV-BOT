module.exports = {
    config: { name: 'married', aliases: ['marriage'], role: 0, description: 'Marriage mode' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length < 2) return api.sendMessage('❌ Mention 2 people', event.threadID);
        const p1 = event.mentions[mentions[0]].replace('@', '');
        const p2 = event.mentions[mentions[1]].replace('@', '');
        api.sendMessage(`💒 ${p1} 💍 ${p2}\n\n👰 Married!\n\n💕 Forever!`, event.threadID);
    }
};
