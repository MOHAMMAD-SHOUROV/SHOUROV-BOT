module.exports = {
    config: { name: 'couple', aliases: ['couple-pic', 'ship'], role: 0, description: 'Create couple profile picture' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length < 2) return api.sendMessage('❌ Mention 2 people for a couple pic!\nUsage: /couple @person1 @person2', event.threadID);
        
        const person1 = event.mentions[mentions[0]].replace('@', '');
        const person2 = event.mentions[mentions[1]].replace('@', '');
        const pp1 = `https://graph.facebook.com/${mentions[0]}/picture?width=500&height=500`;
        const pp2 = `https://graph.facebook.com/${mentions[1]}/picture?width=500&height=500`;
        
        api.sendMessage(`👫 Couple Pic\n\n${person1} 💕 ${person2}\n\nPP1: ${pp1}\nPP2: ${pp2}`, event.threadID);
    }
};
