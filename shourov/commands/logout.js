module.exports = {
    config: { name: 'logout', aliases: ['sign-out'], role: 2, description: 'Logout session' },
    run: async ({ api, event }) => {
        api.sendMessage('🚪 Logout\n\n⚠️ This would end the session', event.threadID);
    }
};
