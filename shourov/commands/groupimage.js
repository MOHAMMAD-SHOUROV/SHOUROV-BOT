module.exports = {
    config: { name: 'groupimage', aliases: ['gimg', 'group-pic'], role: 0, description: 'Group image info' },
    run: async ({ api, event }) => {
        if (!event.isGroup) return api.sendMessage('❌ Group only!', event.threadID);
        api.sendMessage('🖼️ Group Image\n\n💡 Set custom group photo in settings', event.threadID);
    }
};
