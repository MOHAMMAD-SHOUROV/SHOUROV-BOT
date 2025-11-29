module.exports = {
    config: { name: 'fp', aliases: ['firstpost', 'first-post'], role: 0, description: 'First post reference' },
    run: async ({ api, event }) => {
        api.sendMessage('📝 First Post\n\n🎖️ The beginning of greatness!\n\n👑 Every legend starts somewhere!', event.threadID);
    }
};
