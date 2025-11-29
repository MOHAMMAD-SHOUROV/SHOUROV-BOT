module.exports = {
    config: { name: 'removebg', aliases: ['bg-remove'], role: 0, description: 'Remove background' },
    run: async ({ api, event }) => {
        if (event.type !== 'message_reply' || !event.messageReply.attachments?.length) {
            return api.sendMessage('❌ Reply to an image!', event.threadID);
        }
        api.sendMessage('🎨 Removing background...', event.threadID);
    }
};
