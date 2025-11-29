module.exports = {
    config: { name: 'iss', aliases: ['space-station'], role: 0, description: 'ISS information' },
    run: async ({ api, event }) => {
        api.sendMessage('🛰️ International Space Station\n\n🌍 Orbiting Earth\n\n✨ Amazing technology!', event.threadID);
    }
};
