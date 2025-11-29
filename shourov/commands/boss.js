module.exports = {
    config: {
        name: 'boss',
        aliases: ['alpha', 'leader'],
        role: 0,
        description: 'Show boss/alpha status'
    },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        
        if (mentions.length === 0) {
            return api.sendMessage('👑 You\'re the BOSS!\n\n💪 Nobody can mess with you!\n🔥 You\'re unstoppable!', event.threadID);
        }

        const targetID = mentions[0];
        const targetName = event.mentions[targetID].replace('@', '');

        api.sendMessage(`👑 ${targetName} is the BOSS!\n\n💪 Nobody messes with them!\n🔥 They\'re unstoppable!`, event.threadID);
    }
};
