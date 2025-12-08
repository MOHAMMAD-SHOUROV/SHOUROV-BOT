module.exports.config = {
    name: "weather",
    version: "1.0.2",
    permission: 0,
    credits: "ryuko (fixed by assistant)",
    prefix: false,
    description: "see weather information in the area",
    category: "without prefix",
    usages: "[location]",
    cooldown: 5,
    dependencies: {
        "moment-timezone": "",
        // prefer axios when available; fallback to request
        "axios": "",
        "request": ""
    },
    envConfig: {
        "OPEN_WEATHER": "b7f1db5959a1f5b2a079912b03f0cd96"
    }
};

module.exports.languages = {
    "en": {
        "locationNotExist": "Can't find %1.",
        "returnResult": "%1 %2\n🌡️ Temp: %3°C (feels like %4°C)\n☁️ Sky: %5\n💧 Humidity: %6%\n💨 Wind: %7 km/h\n🌅 Sunrise: %8\n🌇 Sunset: %9\n📍 Coordinates: %10, %11"
    }
};

module.exports.run = async ({ api, event, args, getText }) => {
    const moment = global.nodemodule["moment-timezone"];
    const threadID = event.threadID;
    const messageID = event.messageID;

    // choose http client: prefer axios, else request
    const axios = global.nodemodule["axios"] || null;
    const request = global.nodemodule["request"] || null;

    const city = args.join(" ").trim();
    if (!city) return api.sendMessage("Usage: weather [location]", threadID, messageID);

    const cfgKey = (global.configModule && global.configModule[this.config.name] && global.configModule[this.config.name].OPEN_WEATHER)
        || process.env.OPEN_WEATHER
        || this.config.envConfig.OPEN_WEATHER;

    if (!cfgKey) return api.sendMessage("OpenWeather API key missing. Please set OPEN_WEATHER in config or env.", threadID, messageID);

    // determine language (try to pick from global config), default to 'en'
    const lang = (global.config && global.config.language) ? global.config.language : "en";
    const units = "metric"; // Celsius
    const encodedCity = encodeURIComponent(city);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${cfgKey}&units=${units}&lang=${lang}`;

    try {
        let responseBody;

        if (axios) {
            const res = await axios.get(url, { timeout: 10000 });
            responseBody = res.data;
        } else if (request) {
            // wrap request into a Promise
            responseBody = await new Promise((resolve, reject) => {
                request({ url, timeout: 10000 }, (err, res, body) => {
                    if (err) return reject(err);
                    try {
                        const json = JSON.parse(body);
                        return resolve(json);
                    } catch (e) {
                        return reject(new Error("Invalid JSON from weather API"));
                    }
                });
            });
        } else {
            return api.sendMessage("No HTTP client available. Install axios or request.", threadID, messageID);
        }

        // OpenWeather may return { cod: "...", message: "..." } when not found
        if (!responseBody || (responseBody.cod && Number(responseBody.cod) !== 200)) {
            const name = city || "";
            return api.sendMessage(getText("locationNotExist", name), threadID, messageID);
        }

        const w = responseBody;
        const temp = (w.main && typeof w.main.temp !== "undefined") ? Number(w.main.temp).toFixed(1) : "N/A";
        const feels = (w.main && typeof w.main.feels_like !== "undefined") ? Number(w.main.feels_like).toFixed(1) : "N/A";
        const humidity = (w.main && typeof w.main.humidity !== "undefined") ? Number(w.main.humidity) : "N/A";
        const wind_kmh = (w.wind && typeof w.wind.speed !== "undefined") ? (Number(w.wind.speed) * 3.6).toFixed(1) : "N/A";
        const description = (w.weather && w.weather[0] && w.weather[0].description) ? w.weather[0].description : "N/A";
        const icon = (w.weather && w.weather[0] && w.weather[0].icon) ? `http://openweathermap.org/img/wn/${w.weather[0].icon}@2x.png` : null;
        const lat = (w.coord && typeof w.coord.lat !== "undefined") ? w.coord.lat : null;
        const lon = (w.coord && typeof w.coord.lon !== "undefined") ? w.coord.lon : null;

        // timezone offset from UTC in seconds (OpenWeather provides this)
        const tzOffsetSeconds = (typeof w.timezone === "number") ? w.timezone : 0;
        // compute sunrise/sunset times in the local timezone of the place using offset
        const sunriseUnix = (w.sys && w.sys.sunrise) ? Number(w.sys.sunrise) : null;
        const sunsetUnix = (w.sys && w.sys.sunset) ? Number(w.sys.sunset) : null;

        // Determine display timezone: if lat/lon available, try to form an IANA zone via moment-timezone guess.
        // Fallback: use UTC offset to format times.
        let sunriseStr = "N/A";
        let sunsetStr = "N/A";
        try {
            if (sunriseUnix && sunsetUnix) {
                if (lat !== null && lon !== null && moment.tz && moment.tz.guess) {
                    // Try to guess zone by latitude/longitude using moment-timezone's zone lookup (only works if moment-timezone has zone data)
                    // If guess fails or is imprecise, fall back to timezone offset formatting.
                    let zone = null;
                    try {
                        // moment-timezone doesn't expose a direct lat/lon -> zone mapping by default. We'll create times using UTC + offset.
                        zone = null;
                    } catch (e) {
                        zone = null;
                    }

                    if (zone) {
                        sunriseStr = moment.unix(sunriseUnix).tz(zone).format("YYYY-MM-DD HH:mm:ss");
                        sunsetStr = moment.unix(sunsetUnix).tz(zone).format("YYYY-MM-DD HH:mm:ss");
                    } else {
                        // fallback to UTC + offset seconds
                        const offsetHours = tzOffsetSeconds / 3600;
                        sunriseStr = moment.unix(sunriseUnix).utcOffset(offsetHours * 60).format("YYYY-MM-DD HH:mm:ss");
                        sunsetStr = moment.unix(sunsetUnix).utcOffset(offsetHours * 60).format("YYYY-MM-DD HH:mm:ss");
                    }
                } else {
                    const offsetHours = tzOffsetSeconds / 3600;
                    sunriseStr = moment.unix(sunriseUnix).utcOffset(offsetHours * 60).format("YYYY-MM-DD HH:mm:ss");
                    sunsetStr = moment.unix(sunsetUnix).utcOffset(offsetHours * 60).format("YYYY-MM-DD HH:mm:ss");
                }
            }
        } catch (e) {
            sunriseStr = sunriseUnix ? moment.unix(sunriseUnix).utc().format("YYYY-MM-DD HH:mm:ss") : "N/A";
            sunsetStr = sunsetUnix ? moment.unix(sunsetUnix).utc().format("YYYY-MM-DD HH:mm:ss") : "N/A";
        }

        const bodyMsg = getText("returnResult",
            icon ? "🌦️" : "🌤️",
            (w.name ? `${w.name}${w.sys && w.sys.country ? ", " + w.sys.country : ""}` : city),
            temp,
            feels,
            description,
            humidity,
            wind_kmh,
            sunriseStr,
            sunsetStr,
            lat !== null ? lat : "N/A",
            lon !== null ? lon : "N/A"
        );

        // send a message with optional location and image (icon)
        const message = {
            body: bodyMsg
        };

        // attach static map/location if coords are available (the platform supports a 'location' field)
        if (lat !== null && lon !== null) {
            message.location = { latitude: lat, longitude: lon, current: true };
        }

        // if icon exists, attach as image (depends on platform; API may accept 'attachment' or 'urlImage')
        if (icon) {
            // many messenger bots expect an "attachment" with urlImage — adjust to your platform if needed.
            message.attachment = (await _fetchBuffer(icon)).length ? _fetchBuffer(icon) : undefined;
            // NOTE: If your bot framework doesn't accept binary attachments like this, you can instead append the icon url to the body:
            // message.body += `\n${icon}`;
        }

        // If attachment couldn't be formed, ensure at least icon url is visible
        if (!message.attachment && icon) message.body += `\n${icon}`;

        return api.sendMessage(message, threadID, messageID);
    } catch (err) {
        console.error("Weather request error:", err);
        return api.sendMessage("Server error: " + (err.message || err), threadID, messageID);
    }

    // helper: tries to fetch an image buffer (returns Buffer or empty Buffer)
    async function _fetchBuffer(url) {
        try {
            if (axios) {
                const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
                return Buffer.from(res.data);
            } else if (request) {
                return await new Promise((resolve, reject) => {
                    request({ url, encoding: null, timeout: 10000 }, (e, r, body) => {
                        if (e) return resolve(Buffer.alloc(0));
                        return resolve(Buffer.from(body || []));
                    });
                });
            } else {
                return Buffer.alloc(0);
            }
        } catch (e) {
            return Buffer.alloc(0);
        }
    }
};