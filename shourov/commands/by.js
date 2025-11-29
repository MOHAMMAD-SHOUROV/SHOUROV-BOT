module.exports = {
    config: { name: 'by', aliases: ['bye', 'goodbye', 'see-you'], role: 0, description: 'Say goodbye' },
    run: async ({ api, event }) => {
        const messages = [
            '👋 Bye bye! See you later!',
            '✌️ Take care!',
            '🌟 See you soon!',
            '😊 Catch you later!',
            '🙏 Goodbye friend!',
            '💨 I\'m out!',
            '🚀 Peace out!'
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        api.sendMessage(msg, event.threadID);
    }
};
