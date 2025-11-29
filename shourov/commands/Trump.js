module.exports = {
    config: {
        name: 'trump',
        aliases: ['donald', 'potus45'],
        role: 0,
        description: 'Get Trump quotes and statements'
    },
    run: async ({ api, event }) => {
        const quotes = [
            "I will build a great wall – and nobody builds walls better than me, believe me.",
            "You're fired!",
            "We're going to win so much, you're going to be so sick and tired of winning.",
            "I know words. I have the best words.",
            "I think the only difference between me and the other candidates is that I'm more honest and my women are more beautiful.",
            "Part of the beauty of me is that I am very rich.",
            "I will be the greatest jobs president that God ever created.",
            "Sometimes by losing a battle you find a new way to win the war.",
            "I like thinking big. If you're going to be thinking anything, you might as well think big.",
            "What separates the winners from the losers is how a person reacts to each new twist of fate.",
            "Experience taught me a few things. One is to listen to your gut, no matter how good something sounds on paper.",
            "Money was never a big motivation for me, except as a way to keep score.",
            "It's tangible, it's solid, it's beautiful. It's artistic, from my standpoint, and I just love real estate.",
            "Without passion you don't have energy, without energy you have nothing.",
            "I try to learn from the past, but I plan for the future by focusing exclusively on the present."
        ];

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        api.sendMessage(`🇺🇸 Donald Trump\n\n"${randomQuote}"\n\n- 45th President of the United States\n\n💡 #MakeAmericaGreatAgain`, event.threadID);
    }
};
