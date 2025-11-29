module.exports = {
    config: { name: 'hi', aliases: ['hello', 'hey'], role: 0, description: 'Say hello' },
    run: async ({ api, event }) => {
        api.sendMessage('👋 Hi there!\n\n😊 How are you doing?\n\n💬 Let\'s chat!', event.threadID);
    }
};
