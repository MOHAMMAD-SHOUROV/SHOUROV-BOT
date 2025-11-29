module.exports = {
    config: {
        name: '0admin',
        aliases: ['makeadmin', 'promote'],
        role: 2,
        description: 'Promote user to group admin'
    },
    run: async ({ api, event, args }) => {
        if (!event.isGroup) {
            return api.sendMessage('❌ This command only works in group chats!', event.threadID);
        }

        try {
            const mentions = Object.keys(event.mentions);
            
            if (mentions.length === 0) {
                return api.sendMessage('❌ Please mention users to promote!\nUsage: /0admin @user1 @user2', event.threadID);
            }

            const threadInfo = await api.getThreadInfo(event.threadID);
            const botID = api.getCurrentUserID();
            const isAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);

            if (!isAdmin) {
                return api.sendMessage('❌ Bot must be admin to promote users!', event.threadID);
            }

            for (const userID of mentions) {
                await api.changeAdminStatus(event.threadID, userID, true);
            }

            api.sendMessage(`✅ Successfully promoted ${mentions.length} user(s) to admin!`, event.threadID);
        } catch (error) {
            console.error('Admin promotion error:', error);
            api.sendMessage('❌ Failed to promote users. Make sure the bot has admin privileges.', event.threadID);
        }
    }
};
