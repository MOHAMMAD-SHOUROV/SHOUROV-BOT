module.exports = {
    config: { name: 'chor', aliases: ['thief', 'stealer'], role: 0, description: 'Funny thief joke' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('🚨 Nobody is a thief here!\n\n😂 Everyone innocent!', event.threadID);
        
        const targetName = event.mentions[mentions[0]].replace('@', '');
        api.sendMessage(`🚨 Alert! 🚨\n\n${targetName} has stolen...\n\n💔 Your heart!\n😂 Just kidding!`, event.threadID);
    }
};
