module.exports = {
    config: { name: 'pp', aliases: ['profile-pic'], role: 0, description: 'Profile picture' },
    run: async ({ api, event }) => {
        api.sendMessage('📷 Profile Picture\n\n🎯 Set custom avatar', event.threadID);
    }
};
