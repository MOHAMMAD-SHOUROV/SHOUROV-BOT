const axios = require('axios');

module.exports = {
    config: {
        name: 'translate',
        aliases: ['trans', 'tr'],
        role: 0,
        description: 'Translate text to another language'
    },
    run: async ({ api, event, args }) => {
        if (args.length < 2) {
            return api.sendMessage('❌ Usage: /translate <language_code> <text>\nExample: /translate es Hello World\nCommon codes: en, es, fr, de, it, pt, ja, ko, zh', event.threadID);
        }

        const targetLang = args[0].toLowerCase();
        const text = args.slice(1).join(' ');
        
        api.sendMessage('🌐 Translating...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`, {
                    timeout: 10000
                });

                if (response.data && response.data.responseData && response.data.responseData.translatedText) {
                    const translation = response.data.responseData.translatedText;
                    api.editMessage(`🌐 Translation\n\n📝 Original: ${text}\n✅ Translated: ${translation}\n🌍 Language: ${targetLang.toUpperCase()}`, info.messageID);
                } else {
                    api.editMessage('❌ Translation failed. Please check the language code.', info.messageID);
                }
            } catch (error) {
                console.error('Translation error:', error.message);
                api.editMessage('❌ Failed to translate. Please try again.', info.messageID);
            }
        });
    }
};
