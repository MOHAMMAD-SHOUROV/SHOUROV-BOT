const axios = require('axios');

module.exports = {
    config: {
        name: 'weather',
        aliases: ['clima', 'temp'],
        role: 0,
        description: 'Get weather information for a city'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a city name!\nUsage: /weather <city name>', event.threadID);
        }

        const city = args.join(' ');
        
        api.sendMessage('🌤️ Fetching weather...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
                    timeout: 10000
                });

                if (response.data && response.data.current_condition) {
                    const weather = response.data.current_condition[0];
                    const area = response.data.nearest_area[0];
                    
                    const weatherMessage = `
🌤️ WEATHER REPORT

📍 Location: ${area.areaName[0].value}, ${area.country[0].value}
🌡️ Temperature: ${weather.temp_C}°C / ${weather.temp_F}°F
☁️ Condition: ${weather.weatherDesc[0].value}
💨 Wind: ${weather.windspeedKmph} km/h
💧 Humidity: ${weather.humidity}%
👁️ Visibility: ${weather.visibility} km
🌅 Feels Like: ${weather.FeelsLikeC}°C / ${weather.FeelsLikeF}°F
                    `.trim();

                    api.editMessage(weatherMessage, info.messageID);
                } else {
                    api.editMessage('❌ City not found!', info.messageID);
                }
            } catch (error) {
                console.error('Weather error:', error.message);
                api.editMessage('❌ Failed to fetch weather. Please check the city name.', info.messageID);
            }
        });
    }
};
