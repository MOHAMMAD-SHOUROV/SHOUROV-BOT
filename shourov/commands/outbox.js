module.exports = {
    config: { name: 'outbox', aliases: ['sent-box'], role: 0, description: 'Outbox messages' },
    run: async ({ api, event }) => {
        api.sendMessage('📤 Outbox\n\n📨 Sent messages\n\n✉️ Your history', event.threadID);
    }
};
