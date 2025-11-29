module.exports = {
    config: {
        name: 'avt',
        aliases: ['avatar', 'profile-pic'],
        role: 0,
        description: 'Get user profile picture'
    },
    run: async ({ api, event, args }) => {
        try {
            let targetID = event.senderID;
            
            if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
            } else if (args.length > 0 && !isNaN(args[0])) {
                targetID = args[0];
            }

            const userInfo = await api.getUserInfo(targetID);
            const user = userInfo[targetID];

            if (!user) {
                return api.sendMessage('❌ User not found!', event.threadID);
            }

            const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=500&height=500`;
            
            api.sendMessage(`👤 ${user.name}\n\n🔗 Avatar: ${avatarUrl}`, event.threadID);
        } catch (error) {
            console.error('AVT error:', error);
            api.sendMessage('❌ Failed to get avatar.', event.threadID);
        }
    }
};
