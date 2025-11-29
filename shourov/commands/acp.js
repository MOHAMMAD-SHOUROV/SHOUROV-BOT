module.exports = {
    config: {
        name: 'acp',
        aliases: ['accept', 'approve'],
        role: 2,
        description: 'Accept pending group join requests'
    },
    run: async ({ api, event, args }) => {
        if (!event.isGroup) {
            return api.sendMessage('❌ This command only works in group chats!', event.threadID);
        }

        try {
            const threadInfo = await api.getThreadInfo(event.threadID);
            
            if (!threadInfo.approvalMode) {
                return api.sendMessage('❌ This group does not have approval mode enabled!', event.threadID);
            }

            const pendingUsers = threadInfo.approvalQueue || [];

            if (pendingUsers.length === 0) {
                return api.sendMessage('✅ No pending join requests!', event.threadID);
            }

            let accepted = 0;
            const limit = args[0] ? parseInt(args[0]) : pendingUsers.length;

            for (let i = 0; i < Math.min(limit, pendingUsers.length); i++) {
                try {
                    await api.addUserToGroup(pendingUsers[i].userID, event.threadID);
                    accepted++;
                } catch (error) {
                    console.error('Accept error:', error);
                }
            }

            api.sendMessage(`✅ Accepted ${accepted} pending request(s)!`, event.threadID);
        } catch (error) {
            console.error('ACP error:', error);
            api.sendMessage('❌ Failed to accept requests. Make sure bot is admin.', event.threadID);
        }
    }
};
