module.exports = {
    config: { name: 'mlstalk', aliases: ['stalk-ml'], role: 0, description: 'Mobile Legends stalk' },
    run: async ({ api, event }) => {
        api.sendMessage('🎮 Mobile Legends\n\n⚔️ Popular MOBA Game\n\n🏆 Let\'s play!', event.threadID);
    }
};
