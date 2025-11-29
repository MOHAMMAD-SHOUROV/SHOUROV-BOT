module.exports = {
    config: {
        name: 'bio',
        aliases: ['biography', 'about-me'],
        role: 0,
        description: 'Generate random bio/status'
    },
    run: async ({ api, event }) => {
        const bios = [
            '✨ Living my best life',
            '🌟 Dreamer | Believer | Achiever',
            '💫 Creating my own sunshine',
            '🎯 Focused on my goals',
            '🌈 Spreading positivity everywhere',
            '💪 Hustle in silence, let success make the noise',
            '🔥 Born to stand out',
            '⚡ Making every moment count',
            '🌸 Be yourself, everyone else is taken',
            '🎨 Artist of my own life',
            '📚 Forever learning, forever growing',
            '💎 Rare like a diamond',
            '🦋 Transformation in progress',
            '🌺 Blooming where I\'m planted',
            '⭐ Chasing dreams and catching them',
            '🎭 Life is a stage, I\'m the star',
            '🏆 Winners never quit, quitters never win',
            '🌙 Moonchild with a sunny soul',
            '💝 Love, laugh, live',
            '🚀 Sky is not the limit'
        ];

        const randomBio = bios[Math.floor(Math.random() * bios.length)];
        
        api.sendMessage(`✨ Random Bio Generated!\n\n${randomBio}\n\n💡 Use this as your status or bio!`, event.threadID);
    }
};
