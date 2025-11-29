module.exports = {
    config: { name: 'pair', aliases: ['match', 'couple-check'], role: 0, description: 'Check couple compatibility' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length < 2) return api.sendMessage('❌ Mention 2 people', event.threadID);
        const p1 = event.mentions[mentions[0]].replace('@', '');
        const p2 = event.mentions[mentions[1]].replace('@', '');
        const match = Math.floor(Math.random() * 100);
        api.sendMessage(`👫 ${p1} & ${p2}\n\n💕 Compatibility: ${match}%`, event.threadID);
    }
};
