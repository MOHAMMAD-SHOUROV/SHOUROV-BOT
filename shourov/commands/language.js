module.exports = {
    config: { name: 'language', aliases: ['lang'], role: 0, description: 'Language settings' },
    run: async ({ api, event }) => {
        api.sendMessage('🌍 Language\n\n✅ English\n🇧🇩 Bengali\n🇮🇳 Hindi\n\n💡 Currently: English', event.threadID);
    }
};
