module.exports = {
    config: { name: 'rule', aliases: ['rules'], role: 0, description: 'Group rules' },
    run: async ({ api, event }) => {
        api.sendMessage('📋 Group Rules\n\n1. Respect others\n2. No spam\n3. Keep it clean', event.threadID);
    }
};
