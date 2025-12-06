module.exports.config = {
	name: "weather",
	version: "1.0.1",
	permission: 0,
	credits: "ryuko",
    prefix: false,
	description: "see weather information in the area",
	category: "without prefix",
	usages: "[location]",
	cooldowns: 5,
	dependencies: {
		"moment-timezone": "",
		"request": ""
	},
	envConfig: {
		"OPEN_WEATHER": "b7f1db5959a1f5b2a079912b03f0cd96"
	}
};

module.exports.languages = {
	"en": {
		"locationNotExist": "can't find %1.",
		"returnResult": "temp : %1℃\nfeels like : %2℃\nsky : %3\nhumidity : %4%\nwind speed : %5 km/h\nsun rises : %6\nsun sets : %7"
	}
}

module.exports.run = async ({ api, event, args, getText }) => {
	const request = global.nodemodule["request"];
	const moment = global.nodemodule["moment-timezone"];
	const { throwError } = global.utils;
	const { threadID, messageID } = event;

	const city = args.join(" ").trim();
	if (!city) return throwError(this.config.name, threadID, messageID);

	// টিপ: এখানে baseURL নিজে বানিয়ে নিলে ভুলের সম্ভাবনা কমে
	const apiKey = (global.configModule && global.configModule[this.config.name] && global.configModule[this.config.name].OPEN_WEATHER) || process.env.OPEN_WEATHER || this.config.envConfig.OPEN_WEATHER;
	if (!apiKey) return api.sendMessage("OpenWeather API key missing.", threadID, messageID);

	const lang = (global.config && global.config.language) ? global.config.language : "en";
	const url = encodeURI(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=${lang}`);

	request(url, (err, response, body) => {
		if (err) {
			console.error("Weather request error:", err);
			return api.sendMessage("Server error: " + err.message, threadID, messageID);
		}
		let weatherData;
		try {
			weatherData = JSON.parse(body);
		} catch (e) {
			console.error("JSON parse error:", e, body);
			return api.sendMessage("Can't parse weather response.", threadID, messageID);
		}
		if (!weatherData || weatherData.cod !== 200) {
			return api.sendMessage(getText("locationNotExist", city), threadID, messageID);
		}

		// wind: convert m/s -> km/h
		const wind_kmh = (weatherData.wind && weatherData.wind.speed) ? (weatherData.wind.speed * 3.6).toFixed(1) : "N/A";

		const sunrise_date = moment.unix(weatherData.sys.sunrise).tz("Asia/Dhaka");
		const sunset_date = moment.unix(weatherData.sys.sunset).tz("Asia/Dhaka");

		const bodyMsg = getText("returnResult",
			weatherData.main.temp,
			weatherData.main.feels_like,
			(weatherData.weather && weatherData.weather[0] && weatherData.weather[0].description) || "N/A",
			weatherData.main.humidity,
			wind_kmh,
			sunrise_date.format('HH:mm:ss'),
			sunset_date.format('HH:mm:ss')
		);

		api.sendMessage({
			body: bodyMsg,
			location: {
				latitude: weatherData.coord.lat,
				longitude: weatherData.coord.lon,
				current: true
			}
		}, threadID, messageID);
	});
}
