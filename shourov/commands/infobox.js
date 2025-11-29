module.exports = {
    config: { name: 'infobox', aliases: ['info-card'], role: 0, description: 'Information card' },
    run: async ({ api, event }) => {
        api.sendMessage('📦 Information Box\n\n┌─────────────┐\n│ Information │\n└─────────────┘', event.threadID);
    }
};
