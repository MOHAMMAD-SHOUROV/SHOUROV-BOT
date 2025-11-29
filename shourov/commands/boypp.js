module.exports = {
    config: { name: 'boypp', aliases: ['boy-pp', 'boyprofile'], role: 0, description: 'Boy profile picture style' },
    run: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('❌ Please mention a boy!', event.threadID);
        
        const targetID = mentions[0];
        const targetName = event.mentions[targetID].replace('@', '');
        const ppUrl = `https://graph.facebook.com/${targetID}/picture?width=1000&height=1000`;
        
        api.sendMessage(`👨 ${targetName}'s Profile Picture\n\n🔗 ${ppUrl}`, event.threadID);
    }
};
