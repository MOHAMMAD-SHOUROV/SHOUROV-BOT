module.exports = {
    config: { name: 'sendfile', aliases: ['file-send'], role: 0, description: 'Send file' },
    run: async ({ api, event }) => {
        api.sendMessage('📁 Send File\n\n💡 Use cloud services', event.threadID);
    }
};
