module.exports = {
    config: {
        name: 'allbox',
        aliases: ['listgroups', 'groups'],
        role: 2,
        description: 'List all groups bot is in'
    },
    run: async ({ api, event }) => {
        api.sendMessage('📊 Fetching group list...', event.threadID, async (err, info) => {
            try {
                const threadList = await api.getThreadList(25, null, ['INBOX']);
                
                let groupCount = 0;
                let message = '📋 ALL GROUPS LIST\n\n';

                for (const thread of threadList) {
                    if (thread.isGroup) {
                        groupCount++;
                        const name = thread.name || 'Unnamed Group';
                        message += `${groupCount}. ${name}\n   ID: ${thread.threadID}\n   Members: ${thread.participantIDs?.length || 0}\n\n`;
                    }
                }

                message += `\n📊 Total Groups: ${groupCount}`;
                
                api.editMessage(message, info.messageID);
            } catch (error) {
                console.error('Allbox error:', error);
                api.editMessage('❌ Failed to fetch group list.', info.messageID);
            }
        });
    }
};
