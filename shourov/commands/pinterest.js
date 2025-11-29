module.exports = {
    config: { name: 'pinterest', aliases: ['pins'], role: 0, description: 'Pinterest helper' },
    run: async ({ api, event }) => {
        api.sendMessage('📌 Pinterest\n\n🎨 Design inspiration\n\n🔗 https://pinterest.com', event.threadID);
    }
};
