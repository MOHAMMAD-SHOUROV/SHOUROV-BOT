const axios = require('axios');

module.exports = {
    config: {
        name: 'timkiem',
        aliases: ['search-vn', 'tim'],
        role: 0,
        description: 'Vietnamese search command'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Vui lòng nhập từ khóa tìm kiếm!\nUsage: /timkiem <từ khóa>', event.threadID);
        }

        const query = args.join(' ');
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=vi`;

        api.sendMessage(`🔍 Kết quả tìm kiếm\n\n📝 Từ khóa: ${query}\n\n🔗 Xem kết quả: ${searchUrl}`, event.threadID);
    }
};
