module.exports = {
    config: {
        name: 'birthday',
        aliases: ['bday', 'happy-birthday'],
        role: 0,
        description: 'Send birthday wishes'
    },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        
        if (mentions.length === 0) {
            return api.sendMessage('🎂 Please mention someone to celebrate!\nUsage: /birthday @person', event.threadID);
        }

        const targetID = mentions[0];
        const targetName = event.mentions[targetID].replace('@', '');

        const message = `
🎉 HAPPY BIRTHDAY! 🎉

🎂 ${targetName}

🎁 Wishing you a wonderful day!
🎊 May all your dreams come true!
🌟 Hope you're having the best day ever!
🎈 Cheers to another year!

Love you! 💕
        `.trim();

        api.sendMessage(message, event.threadID);
    }
};
