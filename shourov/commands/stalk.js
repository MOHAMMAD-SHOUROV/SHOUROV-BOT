module.exports = {
    config: {
        name: 'stalk',
        aliases: ['lookup', 'fbstalk'],
        role: 0,
        description: 'Get detailed Facebook user information'
    },
    run: async ({ api, event, args }) => {
        try {
            let targetID = event.senderID;
            
            if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
            } else if (args.length > 0 && !isNaN(args[0])) {
                targetID = args[0];
            }

            api.sendMessage('🔍 Stalking user...', event.threadID, async (err, info) => {
                try {
                    const userInfo = await api.getUserInfo(targetID);
                    const user = userInfo[targetID];

                    if (!user) {
                        return api.editMessage('❌ User not found!', info.messageID);
                    }

                    const stalkMessage = `
🔍 STALKER REPORT

👤 Name: ${user.name}
🆔 Facebook ID: ${targetID}
${user.firstName ? `📝 First Name: ${user.firstName}` : ''}
${user.vanity ? `🔗 Username: @${user.vanity}` : ''}
${user.profileUrl ? `🌐 Profile: ${user.profileUrl}` : ''}
⚧️ Gender: ${user.gender === 1 ? 'Female ♀️' : user.gender === 2 ? 'Male ♂️' : 'Other ⚧️'}
${user.isFriend !== undefined ? (user.isFriend ? '✅ Friend Status: Friends' : '❌ Friend Status: Not Friends') : ''}
${user.isBirthday ? '🎂 Birthday: TODAY!' : ''}

🔗 Quick Link: https://facebook.com/${targetID}
                    `.trim();

                    api.editMessage(stalkMessage, info.messageID);
                } catch (error) {
                    console.error('Stalk error:', error);
                    api.editMessage('❌ Failed to stalk user. They might have privacy settings enabled.', info.messageID);
                }
            });
        } catch (error) {
            console.error('Stalk error:', error);
            api.sendMessage('❌ Failed to stalk user.', event.threadID);
        }
    }
};
