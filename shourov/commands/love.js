module.exports = {
    config: {
        name: 'love',
        aliases: ['lovecalc', 'ship'],
        role: 0,
        description: 'Calculate love percentage between two people'
    },
    run: async ({ api, event, args }) => {
        const mentions = Object.keys(event.mentions);
        let name1, name2;

        if (mentions.length >= 2) {
            name1 = event.mentions[mentions[0]].replace('@', '');
            name2 = event.mentions[mentions[1]].replace('@', '');
        } else if (mentions.length === 1) {
            const senderInfo = await api.getUserInfo(event.senderID);
            name1 = senderInfo[event.senderID].name;
            name2 = event.mentions[mentions[0]].replace('@', '');
        } else if (args.length >= 2) {
            const names = args.join(' ').split('&');
            if (names.length >= 2) {
                name1 = names[0].trim();
                name2 = names[1].trim();
            } else {
                return api.sendMessage('❌ Usage: /love @person1 @person2\nOR: /love Name1 & Name2', event.threadID);
            }
        } else {
            return api.sendMessage('❌ Usage: /love @person1 @person2\nOR: /love Name1 & Name2', event.threadID);
        }

        const hash = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash;
            }
            return Math.abs(hash);
        };

        const percentage = (hash(name1 + name2) % 101);

        let message = `💕 LOVE CALCULATOR 💕\n\n`;
        message += `👤 ${name1}\n❤️\n👤 ${name2}\n\n`;
        message += `💖 Love Percentage: ${percentage}%\n`;
        message += `${'█'.repeat(Math.floor(percentage / 5))}${'░'.repeat(20 - Math.floor(percentage / 5))}\n\n`;

        if (percentage < 25) {
            message += `💔 Not meant to be...`;
        } else if (percentage < 50) {
            message += `😐 There's a chance!`;
        } else if (percentage < 75) {
            message += `😊 Good match!`;
        } else if (percentage < 90) {
            message += `😍 Great couple!`;
        } else {
            message += `💯 Perfect match! ✨`;
        }

        api.sendMessage(message, event.threadID);
    }
};
