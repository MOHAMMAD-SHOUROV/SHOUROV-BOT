module.exports = {
  config: {
    name: 'goibot',
    aliases: ['goi'],
    role: 0,
    description: 'GOI Bot information'
  },
  run: async ({ api, event }) => {
    api.sendMessage('🤖 GOI Bot\n\n🎯 Advanced Messenger Bot\n\n✨ Powerful & Reliable!', event.threadID);
  }
};
