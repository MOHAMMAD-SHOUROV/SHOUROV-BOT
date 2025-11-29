module.exports = {
    config: {
        name: 'userinfo',
        aliases: ['user', 'profile'],
        role: 0,
        description: 'Get user profile information'
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

            const infoMessage = `
👤 USER INFORMATION

📝 Name: ${user.name}
🆔 User ID: ${targetID}
${user.vanity ? `🔗 Username: ${user.vanity}` : ''}
${user.profileUrl ? `🌐 Profile: ${user.profileUrl}` : ''}
${user.gender ? `⚧️ Gender: ${user.gender === 1 ? 'Female' : user.gender === 2 ? 'Male' : 'Other'}` : ''}
${user.isFriend ? '✅ Friend: Yes' : '❌ Friend: No'}
            `.trim();

            api.sendMessage(infoMessage, event.threadID);
        } catch (error) {
            console.error('UserInfo error:', error);
            api.sendMessage('❌ Failed to get user information.', event.threadID);
        }
    }
};
