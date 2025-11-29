module.exports = {
    config: { name: 'marry', aliases: ['marry-me'], role: 0, description: 'Marriage proposal' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('💒 Will you marry me?\n\n💍 Say yes!', event.threadID);
        const name = event.mentions[mentions[0]].replace('@', '');
        api.sendMessage(`💒 ${name}\n\n💍 Will you marry me?\n\n👰 I love you!`, event.threadID);
    }
};
