module.exports = {
    config: { name: 'cpt', aliases: ['captain', 'leader'], role: 0, description: 'Captain/Leader mode' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('⚓ You\'re the captain!\n\n🎖️ Lead the way!', event.threadID);
        
        const name = event.mentions[mentions[0]].replace('@', '');
        api.sendMessage(`⚓ ${name} is the CAPTAIN!\n\n🎖️ Follow their lead!\n💪 Lead the team!`, event.threadID);
    }
};
