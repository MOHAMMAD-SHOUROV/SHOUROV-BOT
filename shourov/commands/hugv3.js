module.exports = {
    config: { name: 'hugv3', aliases: ['hug-v3'], role: 0, description: 'Super hug' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        const name = mentions.length > 0 ? event.mentions[mentions[0]].replace('@', '') : 'everyone';
        api.sendMessage(`👐 SUPER HUG for ${name}!\n\n💗 Mega comfort activated!\n\n✨ You got this!`, event.threadID);
    }
};
