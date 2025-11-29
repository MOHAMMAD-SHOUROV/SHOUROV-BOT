module.exports = {
    config: { name: 'filter', aliases: ['filter-msg'], role: 1, description: 'Message filter settings' },
    run: async ({ api, event, args }) => {
        api.sendMessage('🔍 Message Filter\n\n⚙️ Filter Settings:\n• Spam filter\n• Bad words\n• Links\n\n💡 Configure as needed', event.threadID);
    }
};
