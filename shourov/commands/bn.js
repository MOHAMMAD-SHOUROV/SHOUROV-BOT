module.exports = {
    config: {
        name: 'bn',
        aliases: ['bengali', 'bd'],
        role: 0,
        description: 'Bengali greeting/info'
    },
    run: async ({ api, event }) => {
        const message = `
🇧🇩 BENGALI CORNER

আপনাকে স্বাগতম! (Aponake swagotom!)
Welcome to Bengali!

🙏 Namaste: নমস্কার (Nomoshkar)
👋 Hello: হ্যালো (Hallo)
😊 How are you?: আপনি কেমন আছেন? (Apni kemon achen?)
🤝 Nice to meet you: আপনার সাথে পরিচিত হয়ে খুশি (Apnar shathe porichito hoye khushi)
❤️ I love you: আমি তোমাকে ভালোবাসি (Ami tomake valobasi)

🇧🇩 Proud to be Bangladeshi!
        `.trim();

        api.sendMessage(message, event.threadID);
    }
};
