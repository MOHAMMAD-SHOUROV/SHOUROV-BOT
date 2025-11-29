module.exports = {
    config: { name: 'gali_reply', aliases: ['insult-reply', 'comeback'], role: 0, description: 'Clever comeback' },
    run: async ({ api, event }) => {
        const comebacks = [
            '🔥 Your mom jokes are outdated!',
            '😎 I\'ve heard better!',
            '🎯 That\'s the best you got?'
        ];
        api.sendMessage(comebacks[Math.floor(Math.random() * comebacks.length)], event.threadID);
    }
};
