module.exports = {
    config: { name: 'delmsg', aliases: ['delete-msg'], role: 2, description: 'Delete message (reply)' },
    run: async ({ api, event }) => {
        if (event.type !== 'message_reply') return api.sendMessage('❌ Reply to a message to delete it!', event.threadID);
        
        try {
            await api.unsendMessage(event.messageReply.messageID);
            api.sendMessage('✅ Message deleted!', event.threadID);
        } catch (error) {
            api.sendMessage('❌ Cannot delete this message.', event.threadID);
        }
    }
};
