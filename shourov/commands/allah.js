module.exports = {
    config: {
        name: 'allah',
        aliases: ['asmaul-husna', '99names'],
        role: 0,
        description: 'Get one of the 99 names of Allah'
    },
    run: async ({ api, event }) => {
        const names = [
            { arabic: 'ٱلْرَّحْمَـانُ', transliteration: 'Ar-Rahman', meaning: 'The Most Merciful' },
            { arabic: 'ٱلْرَّحِيْمُ', transliteration: 'Ar-Rahim', meaning: 'The Bestower of Mercy' },
            { arabic: 'ٱلْمَلِكُ', transliteration: 'Al-Malik', meaning: 'The King' },
            { arabic: 'ٱلْقُدُّوسُ', transliteration: 'Al-Quddus', meaning: 'The Absolutely Pure' },
            { arabic: 'ٱلْسَّلَامُ', transliteration: 'As-Salam', meaning: 'The Perfection and Giver of Peace' },
            { arabic: 'ٱلْمُؤْمِنُ', transliteration: 'Al-Mumin', meaning: 'The One Who Gives Emaan' },
            { arabic: 'ٱلْمُهَيْمِنُ', transliteration: 'Al-Muhaymin', meaning: 'The Guardian' },
            { arabic: 'ٱلْعَزِيزُ', transliteration: 'Al-Aziz', meaning: 'The Almighty' },
            { arabic: 'ٱلْجَبَّارُ', transliteration: 'Al-Jabbar', meaning: 'The Compeller' },
            { arabic: 'ٱلْمُتَكَبِّرُ', transliteration: 'Al-Mutakabbir', meaning: 'The Supreme' },
            { arabic: 'ٱلْخَالِقُ', transliteration: 'Al-Khaliq', meaning: 'The Creator' },
            { arabic: 'ٱلْبَارِئُ', transliteration: "Al-Bari'", meaning: 'The Originator' },
            { arabic: 'ٱلْمُصَوِّرُ', transliteration: 'Al-Musawwir', meaning: 'The Fashioner' },
            { arabic: 'ٱلْغَفَّارُ', transliteration: 'Al-Ghaffar', meaning: 'The Constant Forgiver' },
            { arabic: 'ٱلْقَهَّارُ', transliteration: 'Al-Qahhar', meaning: 'The All-Prevailing One' },
            { arabic: 'ٱلْوَهَّابُ', transliteration: 'Al-Wahhab', meaning: 'The Supreme Bestower' },
            { arabic: 'ٱلْرَّزَّاقُ', transliteration: 'Ar-Razzaq', meaning: 'The Provider' },
            { arabic: 'ٱلْفَتَّاحُ', transliteration: 'Al-Fattah', meaning: 'The Opener' },
            { arabic: 'ٱلْعَلِيمُ', transliteration: 'Al-Alim', meaning: 'The All-Knowing' },
            { arabic: 'ٱلْقَابِضُ', transliteration: 'Al-Qabid', meaning: 'The Withholder' },
            { arabic: 'ٱلْبَاسِطُ', transliteration: 'Al-Basit', meaning: 'The Extender' },
            { arabic: 'ٱلْخَافِضُ', transliteration: 'Al-Khafid', meaning: 'The Reducer' },
            { arabic: 'ٱلْرَّافِعُ', transliteration: "Ar-Rafi'", meaning: 'The Exalter' },
            { arabic: 'ٱلْمُعِزُّ', transliteration: "Al-Mu'izz", meaning: 'The Honourer' },
            { arabic: 'ٱلْمُذِلُّ', transliteration: 'Al-Mudhill', meaning: 'The Dishonourer' }
        ];

        const randomName = names[Math.floor(Math.random() * names.length)];

        const message = `
🕌 Asmaul Husna - Names of Allah

${randomName.arabic}
${randomName.transliteration}

✨ Meaning: ${randomName.meaning}

سُبْحَانَ ٱللَّٰهِ
Subhanallah (Glory be to Allah)
        `.trim();

        api.sendMessage(message, event.threadID);
    }
};
