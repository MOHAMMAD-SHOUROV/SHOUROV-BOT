module.exports = {
    config: { name: 'rip', aliases: ['death'], role: 0, description: 'RIP message' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        const name = mentions.length > 0 ? event.mentions[mentions[0]].replace('@', '') : 'someone';
        api.sendMessage(`⚰️ RIP ${name}\n\n😢 Gone but not forgotten`, event.threadID);
    }
};
