// prayer.js
module.exports.config = {
  name: "prayer",
  version: "1.0.0",
  permission: 0,
  prefix: true,
  credits: "shourov",
  description: "Get today's prayer times for a city or coordinates (lat lon)",
  category: "utility",
  usages: "prayer <city> OR prayer <city,country> OR prayer <lat> <lon>",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID, senderID } = event;

  try {
    if (!args || args.length === 0) {
      return api.sendMessage(
        `Usage:\n` +
        `• ${global.config.PREFIX}prayer <city>\n` +
        `• ${global.config.PREFIX}prayer "<city>,<country>"\n` +
        `• ${global.config.PREFIX}prayer <lat> <lon>\n\n` +
        `Example: ${global.config.PREFIX}prayer Dhaka\n` +
        `Example: ${global.config.PREFIX}prayer "New York,US"\n` +
        `Example: ${global.config.PREFIX}prayer 23.7104 90.4074`,
        threadID, messageID
      );
    }

    // determine input type: lat lon (two numeric args) OR city string
    let url = null;
    if (args.length === 2 && !isNaN(parseFloat(args[0])) && !isNaN(parseFloat(args[1]))) {
      // lat lon
      const lat = parseFloat(args[0]);
      const lon = parseFloat(args[1]);
      url = `http://api.aladhan.com/v1/timings/${Math.floor(Date.now()/1000)}?latitude=${lat}&longitude=${lon}&method=2`;
    } else {
      // city or "city,country"
      const joined = args.join(" ").trim();
      // if user provided "City,Country" keep as is
      let city = joined;
      let country = "";
      if (joined.includes(",")) {
        const parts = joined.split(",").map(p => p.trim());
        city = parts[0];
        country = parts.slice(1).join(","); // allow commas in country
      }
      // use timingsByCity endpoint
      // encode components
      const qcity = encodeURIComponent(city);
      const qcountry = country ? `&country=${encodeURIComponent(country)}` : ``;
      url = `http://api.aladhan.com/v1/timingsByCity?city=${qcity}${qcountry}&method=2`;
    }

    const res = await axios.get(url, { timeout: 10000 });
    if (!res.data || res.data.code !== 200 || !res.data.data) {
      return api.sendMessage("❌ Could not fetch prayer times. Try different input.", threadID, messageID);
    }

    const data = res.data.data;
    const meta = data.meta || {};
    const timings = data.timings || {};
    const dateReadable = (data.date && (data.date.readable || data.date.gregorian?.date)) || new Date().toLocaleDateString();

    // Build message
    const zone = meta.timezone || "";
    let body = `🕌 Prayer times — ${dateReadable}\n`;
    if (zone) body += `⏰ Timezone: ${zone}\n`;
    body += `\n`;
    const order = ["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha"];
    for (const k of order) {
      if (timings[k]) body += `• ${k}: ${timings[k]}\n`;
    }
    // include optional extra times if present
    const extras = ["Imsak","Midnight","Sunset"];
    body += `\n`;
    for (const e of extras) {
      if (timings[e]) body += `• ${e}: ${timings[e]}\n`;
    }

    // add calculation method & location info if available
    if (meta && meta.method && meta.method.name) {
      body += `\n⚙️ Method: ${meta.method.name}`;
      if (meta.method.params && meta.method.params.Fajr) {
        body += ` (Fajr angle ${meta.method.params.Fajr})`;
      }
    }
    if (meta && meta.latitude && meta.longitude) {
      body += `\n📍 Lat/Lon: ${meta.latitude}, ${meta.longitude}`;
    }
    if (meta && meta.offset && Object.keys(meta.offset).length) {
      body += `\n\nNote: custom offsets applied.`;
    }

    return api.sendMessage(body, threadID, messageID);

  } catch (err) {
    console.log("prayer error:", err && err.message ? err.message : err);
    return api.sendMessage("❌ Error getting prayer times. Make sure your input is correct (city or lat lon).", threadID, messageID);
  }
};