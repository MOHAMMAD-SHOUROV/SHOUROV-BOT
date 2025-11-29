module.exports = {
    config: { name: 'crush', aliases: ['crush-info'], role: 0, description: 'Crush information' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('❌ Mention your crush!\nUsage: /crush @person', event.threadID);
        
        const crushName = event.mentions[mentions[0]].replace('@', '');
        const msg = `
💘 Crush Info

👤 Crush: ${crushName}
💕 Status: In Love
😍 Love Level: 💯
🎯 Chance: High!

Good luck! 🍀
        `.trim();
        
        api.sendMessage(msg, event.threadID);
    }
};
