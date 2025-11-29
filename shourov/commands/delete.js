module.exports = {
    config: { name: 'delete', aliases: ['remove', 'del'], role: 2, description: 'Delete messages' },
    run: async ({ api, event }) => {
        api.sendMessage('⚠️ This would delete messages.\n\n💡 Feature limited by Facebook API permissions.\n\n🔒 Only works with bot\'s own messages.', event.threadID);
    }
};
