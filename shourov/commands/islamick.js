module.exports = {
    config: { name: 'islamick', aliases: ['islamic-v2'], role: 0, description: 'Islamic facts' },
    run: async ({ api, event }) => {
        const facts = ['الحمد لله - All praise is for Allah', 'الصلاة خير من النوم - Prayer is better than sleep', 'لا إله إلا الله - There is no god but Allah'];
        api.sendMessage(`🕌 ${facts[Math.floor(Math.random() * facts.length)]}`, event.threadID);
    }
};
