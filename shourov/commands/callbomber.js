module.exports = {
    config: { name: 'callbomber', aliases: ['call-bomb'], role: 2, description: '⚠️ DISABLED - Call bombing is illegal' },
    run: async ({ api, event }) => {
        api.sendMessage('⚠️ DISABLED\n\nThis command has been disabled as call bombing and SMS harassment are illegal in Bangladesh and worldwide.\n\n🔒 This feature violates:\n• Bangladesh Telecommunication Regulation\n• Penal Code 507, 509\n• Digital Security Act 2018\n\n❌ Using this would result in legal consequences.', event.threadID);
    }
};
