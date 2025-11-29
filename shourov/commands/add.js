module.exports = {
    config: {
        name: 'add',
        aliases: ['addmember'],
        role: 1,
        description: 'Add user to group'
    },
    run: async ({ api, event, args }) => {
        if (!event.isGroup) {
            return api.sendMessage('❌ This command only works in group chats!', event.threadID);
        }

        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a user ID!\nUsage: /add <userID>', event.threadID);
        }

        const userID = args[0];

        if (!/^\d+$/.test(userID)) {
            return api.sendMessage('❌ Please provide a valid numeric user ID!', event.threadID);
        }

        try {
            await api.addUserToGroup(userID, event.threadID);
            api.sendMessage(`✅ Successfully added user ${userID} to the group!`, event.threadID);
        } catch (error) {
            console.error('Add user error:', error);
            api.sendMessage('❌ Failed to add user. They may have blocked the bot or privacy settings prevent adding.', event.threadID);
        }
    }
};
