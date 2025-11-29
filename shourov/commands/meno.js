module.exports = {
    config: { name: 'meno', aliases: ['menu'], role: 0, description: 'Menu display' },
    run: async ({ api, event }) => {
        api.sendMessage('📱 Menu\n\n🏠 Home\n👤 Profile\n⚙️ Settings\n📞 Help', event.threadID);
    }
};
