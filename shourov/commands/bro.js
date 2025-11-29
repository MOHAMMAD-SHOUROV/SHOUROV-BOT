module.exports = {
    config: { name: 'bro', aliases: ['brother', 'bhai'], role: 0, description: 'Brother mode' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('🤝 You\'re a cool bro!\n\n💪 Keep it up!', event.threadID);
        
        const targetName = event.mentions[mentions[0]].replace('@', '');
        api.sendMessage(`🤝 ${targetName} is my bro!\n\n💪 We got each other's back!\n🔥 Brothers for life!`, event.threadID);
    }
};
