module.exports = {
    config: {
        name: 'arrest',
        aliases: ['jail', 'prison'],
        role: 0,
        description: 'Fun arrest command'
    },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        
        if (mentions.length === 0) {
            return api.sendMessage('🚨 Nobody got arrested!\n\n💡 Mention someone to arrest them (for fun!)!', event.threadID);
        }

        const targetID = mentions[0];
        const targetName = event.mentions[targetID].replace('@', '');

        api.sendMessage(`🚨 ARREST REPORT\n\n👤 Arrested: ${targetName}\n📋 Charges: Being too cool\n🔒 Status: JAILED\n⏰ Sentence: 24 hours\n\n😂 Just kidding!`, event.threadID);
    }
};
