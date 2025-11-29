module.exports = {
    config: { name: 'diya', aliases: ['lamp', 'light'], role: 0, description: 'Diwali lamp message' },
    run: async ({ api, event }) => {
        api.sendMessage(`🪔 Diya - Light of Hope\n\n🕯️ Lighting the path\n✨ Spreading joy\n🌟 Happy Diwali!\n\n🪔 Let there be light!`, event.threadID);
    }
};
