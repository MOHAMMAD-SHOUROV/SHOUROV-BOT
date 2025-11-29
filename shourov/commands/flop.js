module.exports = {
    config: { name: 'flop', aliases: ['fail', 'oops'], role: 0, description: 'Flop/fail message' },
    run: async ({ api, event }) => {
        api.sendMessage('💥 FLOP!\n\n😅 Oops! That didn\'t work\n\n🔄 Try again!', event.threadID);
    }
};
