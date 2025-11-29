module.exports = {
    config: { name: 'resend', aliases: ['retry'], role: 0, description: 'Resend message' },
    run: async ({ api, event }) => {
        api.sendMessage('📤 Message resent!', event.threadID);
    }
};
