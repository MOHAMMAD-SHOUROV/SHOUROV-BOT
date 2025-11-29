module.exports = {
    config: { name: 'inbox', aliases: ['messages'], role: 0, description: 'Inbox status' },
    run: async ({ api, event }) => {
        api.sendMessage('📬 Inbox\n\n💌 Check your messages\n\n✉️ Stay connected!', event.threadID);
    }
};
