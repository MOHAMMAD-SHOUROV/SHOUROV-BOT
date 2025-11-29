module.exports = {
    config: { name: 'result', aliases: ['outcome'], role: 0, description: 'Show result' },
    run: async ({ api, event }) => {
        api.sendMessage('📊 Result\n\n✅ Success!', event.threadID);
    }
};
