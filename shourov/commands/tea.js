module.exports = {
    config: {
        name: 'tea',
        aliases: ['chai', 'coffee'],
        role: 0,
        description: 'Serve virtual tea/chai to someone'
    },
    run: async ({ api, event, args }) => {
        const mentions = Object.keys(event.mentions);
        
        if (mentions.length === 0) {
            return api.sendMessage('☕ Here\'s your tea!\n\n🍵 Enjoy your hot cup of chai!\n\n💡 Tip: Mention someone to serve them tea!', event.threadID);
        }

        const targetID = mentions[0];
        const targetName = event.mentions[targetID].replace('@', '');

        const teaMessages = [
            `☕ Serving hot tea to ${targetName}!\n🍵 Chai is ready, enjoy!`,
            `🍵 ${targetName}, here's your special chai!\n☕ Made with love and cardamom!`,
            `☕ Tea time for ${targetName}!\n🍪 Here's some cookies too!`,
            `🍵 Fresh chai for ${targetName}!\n☕ Careful, it's hot!`,
            `☕ ${targetName}, your tea is served!\n🧁 With a side of biscuits!`
        ];

        const message = teaMessages[Math.floor(Math.random() * teaMessages.length)];
        api.sendMessage(message, event.threadID);
    }
};
