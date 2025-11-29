module.exports = {
    config: { name: 'pooh', aliases: ['winnie'], role: 0, description: 'Winnie the Pooh' },
    run: async ({ api, event }) => {
        api.sendMessage('🐻 Winnie the Pooh\n\n🍯 Honey lover\n\n💛 Cute bear!', event.threadID);
    }
};
