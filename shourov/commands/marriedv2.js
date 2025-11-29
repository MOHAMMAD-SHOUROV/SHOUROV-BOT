module.exports = {
    config: { name: 'marriedv2', aliases: ['married-v2'], role: 0, description: 'Marriage v2' },
    run: async ({ api, event }) => {
        api.sendMessage('💒 Marriage Mode V2\n\n💞 Love is in the air!', event.threadID);
    }
};
