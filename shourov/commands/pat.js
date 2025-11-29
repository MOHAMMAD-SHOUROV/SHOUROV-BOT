module.exports = {
    config: { name: 'pat', aliases: ['pet'], role: 0, description: 'Pat someone' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        const name = mentions.length > 0 ? event.mentions[mentions[0]].replace('@', '') : 'you';
        api.sendMessage(`👋 Pat ${name}!\n\n✨ Good job!`, event.threadID);
    }
};
