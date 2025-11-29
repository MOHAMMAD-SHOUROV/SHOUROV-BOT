module.exports = {
    config: { name: 'emoji', aliases: ['emojis', 'emoticon'], role: 0, description: 'Show emoji collection' },
    run: async ({ api, event }) => {
        const msg = `😊 Emoji Collection\n\n😀 😁 😂 🤣 😃\n😄 😅 😆 😉 😊\n❤️ 💔 💕 💖 💗\n🎉 🎊 🎈 🎁 🎀`;
        api.sendMessage(msg, event.threadID);
    }
};
