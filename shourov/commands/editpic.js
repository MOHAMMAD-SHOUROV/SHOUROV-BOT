module.exports = {
    config: { name: 'editpic', aliases: ['edit-pic', 'photo-edit'], role: 0, description: 'Edit picture' },
    run: async ({ api, event }) => {
        if (event.type !== 'message_reply' || !event.messageReply.attachments?.length) {
            return api.sendMessage('❌ Reply to an image to edit it!', event.threadID);
        }
        api.sendMessage('🖼️ Photo Editor\n\n💡 Recommended tools:\n• Canva\n• Photoshop\n• PicsArt\n• Pixlr', event.threadID);
    }
};
