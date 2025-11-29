module.exports = {
    config: { name: 'files', aliases: ['file', 'send-file'], role: 0, description: 'File sharing helper' },
    run: async ({ api, event, args }) => {
        api.sendMessage('📁 File Sharing\n\n💡 Use cloud storage:\n• Google Drive\n• Dropbox\n• OneDrive\n• WeTransfer', event.threadID);
    }
};
