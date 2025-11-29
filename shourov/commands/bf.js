module.exports = {
    config: {
        name: 'bf',
        aliases: ['boyfriend', 'crush'],
        role: 0,
        description: 'Boyfriend/girlfriend mode'
    },
    run: async ({ api, event, args }) => {
        const mentions = Object.keys(event.mentions);
        
        if (mentions.length === 0) {
            return api.sendMessage('❌ Please mention someone!\nUsage: /bf @person', event.threadID);
        }

        const targetID = mentions[0];
        const targetName = event.mentions[targetID].replace('@', '');

        api.sendMessage(`💑 Boyfriend Mode\n\n👤 Your Crush: ${targetName}\n❤️ Love Level: 99%\n💕 Status: In Love!\n\n😍 They're amazing!`, event.threadID);
    }
};
