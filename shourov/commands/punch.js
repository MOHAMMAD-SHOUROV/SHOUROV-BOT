module.exports = {
    config: { name: 'punch', aliases: ['hit'], role: 0, description: 'Punch someone' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        const name = mentions.length > 0 ? event.mentions[mentions[0]].replace('@', '') : 'air';
        api.sendMessage(`👊 *Punches ${name}*\n\n💥 BAM!`, event.threadID);
    }
};
