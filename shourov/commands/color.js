module.exports = {
    config: { name: 'color', aliases: ['colour', 'hex-color'], role: 0, description: 'Generate random color' },
    run: async ({ api, event }) => {
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        const rgb = parseInt(randomColor.slice(1), 16);
        const r = (rgb >> 16) & 255;
        const g = (rgb >> 8) & 255;
        const b = rgb & 255;
        
        api.sendMessage(`🎨 Random Color\n\n💜 HEX: ${randomColor}\n🎨 RGB: (${r}, ${g}, ${b})\n\n🌈 Beautiful!`, event.threadID);
    }
};
