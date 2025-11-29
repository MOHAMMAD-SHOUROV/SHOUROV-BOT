module.exports = {
    config: {
        name: 'tts',
        aliases: ['texttospeech', 'speak'],
        role: 0,
        description: 'Convert text to speech'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide text to convert!\nUsage: /tts <text>', event.threadID);
        }

        const text = args.join(' ');
        
        if (text.length > 200) {
            return api.sendMessage('❌ Text is too long! Maximum 200 characters.', event.threadID);
        }

        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;

        api.sendMessage(`🔊 Text to Speech\n\n📝 Text: ${text}\n\n🔗 Listen: ${ttsUrl}\n\n💡 Tip: You can change the language by using language codes (en, es, fr, etc.)`, event.threadID);
    }
};
