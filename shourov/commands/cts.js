module.exports = {
    config: { name: 'cts', aliases: ['cute-smile'], role: 0, description: 'Cute smile emojis' },
    run: async ({ api, event }) => {
        api.sendMessage(`😊 Cute Smiles 😊\n\n😁 😊 🥰 😍 😘 😻 😸\n\n💕 Spread positivity!`, event.threadID);
    }
};
