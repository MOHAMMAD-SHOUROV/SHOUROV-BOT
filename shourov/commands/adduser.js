module.exports = {
    config: {
        name: 'adduser',
        aliases: ['addu', 'invite'],
        role: 1,
        description: 'Add multiple users to group'
    },
    run: async ({ api, event, args }) => {
        if (!event.isGroup) {
            return api.sendMessage('❌ This command only works in group chats!', event.threadID);
        }

        if (args.length === 0) {
            return api.sendMessage('❌ Please provide user IDs!\nUsage: /adduser <id1> <id2> <id3>', event.threadID);
        }

        let success = 0;
        let failed = 0;

        for (const userID of args) {
            if (!/^\d+$/.test(userID)) {
                failed++;
                continue;
            }

            try {
                await api.addUserToGroup(userID, event.threadID);
                success++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                failed++;
            }
        }

        api.sendMessage(`✅ Added ${success} user(s) successfully\n${failed > 0 ? `❌ Failed to add ${failed} user(s)` : ''}`, event.threadID);
    }
};
