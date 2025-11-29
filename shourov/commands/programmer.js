module.exports = {
    config: { name: 'programmer', aliases: ['dev', 'coder'], role: 0, description: 'Programmer info' },
    run: async ({ api, event }) => {
        api.sendMessage('💻 Programmer Mode\n\n🔧 Debug mode active\n\n📝 Code ready!', event.threadID);
    }
};
