module.exports = {
    config: { name: 'dog', aliases: ['doggo', 'puppy'], role: 0, description: 'Funny dog command' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('🐕 Woof woof!\n\n🐶 I\'m a good boy!', event.threadID);
        
        const name = event.mentions[mentions[0]].replace('@', '');
        api.sendMessage(`🐕 ${name} is a doggo!\n\n🐶 Woof woof!\n😂 Just kidding!`, event.threadID);
    }
};
