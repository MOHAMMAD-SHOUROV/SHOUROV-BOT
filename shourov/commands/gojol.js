module.exports = {
    config: { name: 'gojol', aliases: ['horoscope'], role: 0, description: 'Horoscope/astrology' },
    run: async ({ api, event, args }) => {
        const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        const sign = signs[Math.floor(Math.random() * signs.length)];
        api.sendMessage(`♈ Daily Horoscope\n\n🌟 ${sign}\n\n💫 Lucky day ahead!\n\n✨ Follow your stars!`, event.threadID);
    }
};
