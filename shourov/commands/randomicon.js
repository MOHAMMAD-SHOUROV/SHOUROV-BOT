module.exports = {
    config: { name: 'randomicon', aliases: ['icon'], role: 0, description: 'Random icon' },
    run: async ({ api, event }) => {
        const icons = ['😀', '😂', '😍', '🔥', '👏', '🎉', '🚀', '💯'];
        api.sendMessage(icons[Math.floor(Math.random() * icons.length)], event.threadID);
    }
};
