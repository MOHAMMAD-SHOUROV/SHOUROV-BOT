const axios = require('axios');

module.exports = {
    config: {
        name: 'ajan-time',
        aliases: ['namaz', 'prayer-time', 'salah'],
        role: 0,
        description: 'Get prayer times for Bangladesh (Dhaka)'
    },
    run: async ({ api, event, args }) => {
        const city = args.length > 0 ? args.join(' ') : 'Dhaka';
        const country = 'Bangladesh';
        
        api.sendMessage('🕌 Fetching prayer times...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity`, {
                    params: {
                        city: city,
                        country: country,
                        method: 2
                    },
                    timeout: 10000
                });

                if (response.data && response.data.data) {
                    const timings = response.data.data.timings;
                    const date = response.data.data.date.readable;
                    const hijri = response.data.data.date.hijri.date;

                    const message = `
🕌 Prayer Times (Namaz)
📍 ${city}, ${country}

📅 Date: ${date}
🌙 Hijri: ${hijri}

⏰ Prayer Times:
━━━━━━━━━━━━━━━
🌅 Fajr: ${timings.Fajr}
🌄 Sunrise: ${timings.Sunrise}
☀️ Dhuhr: ${timings.Dhuhr}
🌤️ Asr: ${timings.Asr}
🌆 Maghrib: ${timings.Maghrib}
🌃 Isha: ${timings.Isha}

🌙 Midnight: ${timings.Midnight}

اَلصَّلاَةُ خَيْرٌ مِّنَ النَّوْمِ
Prayer is better than sleep
                    `.trim();

                    api.editMessage(message, info.messageID);
                } else {
                    api.editMessage('❌ Failed to fetch prayer times.', info.messageID);
                }
            } catch (error) {
                console.error('Prayer times error:', error.message);
                api.editMessage(`❌ Failed to fetch prayer times.\n💡 Try: /ajan-time <city name>`, info.messageID);
            }
        });
    }
};
