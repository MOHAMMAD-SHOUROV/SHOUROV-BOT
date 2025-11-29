const axios = require('axios');

module.exports = {
    config: {
        name: 'islam',
        aliases: ['islamic', 'quran'],
        role: 0,
        description: 'Get random Quranic verse'
    },
    run: async ({ api, event }) => {
        api.sendMessage('📖 Fetching Quranic verse...', event.threadID, async (err, info) => {
            try {
                const surah = Math.floor(Math.random() * 114) + 1;
                const response = await axios.get(`https://api.alquran.cloud/v1/surah/${surah}/en.asad`, {
                    timeout: 10000
                });

                if (response.data && response.data.data) {
                    const surahData = response.data.data;
                    const randomAyah = surahData.ayahs[Math.floor(Math.random() * surahData.ayahs.length)];
                    
                    const message = `📖 Quran - Surah ${surahData.englishName}\n\n${randomAyah.text}\n\n📍 ${surahData.name} (${surahData.englishName})\n📝 Ayah ${randomAyah.numberInSurah}\n🕌 Translation: English (Muhammad Asad)`;
                    
                    api.editMessage(message, info.messageID);
                } else {
                    api.editMessage('❌ Failed to fetch verse.', info.messageID);
                }
            } catch (error) {
                console.error('Islam error:', error.message);
                api.editMessage('❌ Failed to fetch Quranic verse. Please try again.', info.messageID);
            }
        });
    }
};
