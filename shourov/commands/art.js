module.exports = {
    config: {
        name: 'art',
        aliases: ['draw', 'artwork'],
        role: 0,
        description: 'ASCII art display'
    },
    run: async ({ api, event, args }) => {
        const artTypes = ['cat', 'dog', 'heart', 'star'];
        
        const art = {
            cat: `
    /\\_/\\
   ( o.o )
    > ^ <
   /|   |\\
  (_|   |_)
            `,
            dog: `
    / \\__
   (    @\\___
   /         O
  /   (_____/
 /_____/   U
            `,
            heart: `
  ♥ ♥ ♥ ♥ ♥
 ♥           ♥
♥             ♥
♥             ♥
 ♥           ♥
  ♥ ♥ ♥ ♥ ♥
            `,
            star: `
        *
       ***
      *****
     *******
    *********
   ***********
      |   |
      |   |
            `
        };

        const type = args.length > 0 ? args[0].toLowerCase() : 'star';
        const selectedArt = art[type] || art['star'];

        api.sendMessage(`🎨 ASCII Art\n\n${selectedArt}\n\n💡 Types: ${artTypes.join(', ')}`, event.threadID);
    }
};
