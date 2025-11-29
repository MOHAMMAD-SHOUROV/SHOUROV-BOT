module.exports = {
    config: { name: 'hugv2', aliases: ['hug-v2', 'warm-hug'], role: 0, description: 'Alternative hug' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        const name = mentions.length > 0 ? event.mentions[mentions[0]].replace('@', '') : 'You';
        api.sendMessage(`💕 ${name}\n\n*sends warm hug*\n\n🥰 Feeling better?`, event.threadID);
    }
};
