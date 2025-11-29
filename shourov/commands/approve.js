module.exports = {
    config: {
        name: 'approve',
        aliases: ['accept-request', 'ok'],
        role: 1,
        description: 'Approve pending requests'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a user ID!\nUsage: /approve <userID>', event.threadID);
        }

        const userID = args[0];

        try {
            await api.addUserToGroup(userID, event.threadID);
            api.sendMessage(`✅ User ${userID} has been approved and added!`, event.threadID);
        } catch (error) {
            console.error('Approve error:', error);
            api.sendMessage('❌ Failed to approve user.', event.threadID);
        }
    }
};
