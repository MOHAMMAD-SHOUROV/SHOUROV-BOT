module.exports = {
    config: { name: 'crush2', aliases: ['crush-v2'], role: 0, description: 'Alternative crush command' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('❌ Mention someone!\nUsage: /crush2 @person', event.threadID);
        
        const name = event.mentions[mentions[0]].replace('@', '');
        api.sendMessage(`🌹 ${name}\n\nYou're my crush! 💕\n\n😘 Forever yours!`, event.threadID);
    }
};
