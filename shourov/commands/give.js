module.exports = {
    config: { name: 'give', aliases: ['gift', 'present'], role: 0, description: 'Gift giving' },
    run: async ({ api, event, args }) => {
        const mentions = Object.keys(event.mentions);
        if (mentions.length === 0) return api.sendMessage('🎁 Give something!\n\n💝 Mention someone!', event.threadID);
        const gift = args.length > 0 ? args.join(' ') : 'a gift';
        const name = event.mentions[mentions[0]].replace('@', '');
        api.sendMessage(`🎁 ${name} received ${gift}!\n\n💝 From your friend!`, event.threadID);
    }
};
