module.exports = {
    config: { name: 'menu', aliases: ['main-menu'], role: 0, description: 'Main menu' },
    run: async ({ api, event }) => {
        const msg = `📋 Main Menu\n\n📚 Help: /help\n🤖 About: /about\n📞 Commands: /command\n⚙️ Settings: /config`;
        api.sendMessage(msg, event.threadID);
    }
};
