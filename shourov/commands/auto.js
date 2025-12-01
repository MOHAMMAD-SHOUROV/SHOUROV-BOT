// commands/autotime.js
module.exports.config = {
  name: "auto",
  version: "2.0.1",
  permission: 0,
  credits: "shourov (fixed)",
  description: "২৪ ঘণ্টা সময় অনুযায়ী স্বয়ংক্রিয় বার্তা পাঠানো (Asia/Dhaka)",
  prefix: true,
  category: "auto",
  usages: "[now]",
  cooldowns: 5
};

module.exports.name = module.exports.config.name;

const nam = [
  { timer: '12:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 12:00 AM - রাতের শুরুতেও কষ্টটা একই রকম...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '12:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 12:30 AM - মনের কথা বলা সবচেয়ে কঠিন কাজ..FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '01:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 01:00 AM - নিঃশব্দ রাত অনেক কিছু বলে দেয়...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '01:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 01:30 AM - গভীর রাত মানেই একাকীত্ব...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '02:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 02:00 AM - তোমার স্মৃতি এখনো জাগে...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '02:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 02:30 AM - চোখের জল লুকানো যায় না...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '03:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 03:00 AM - ঘুম আসে না, কারণ মন ব্যথায় ভরা..FACEBOOK:https://www.facebook.com/shourov.sm24.'] },
  { timer: '03:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 03:30 AM - রাত যত বাড়ে, স্মৃতি তত জাগে..FACEBOOK:https://www.facebook.com/shourov.sm24.'] },
  { timer: '04:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 04:00 AM - একাকীত্বের অনুভূতি চিরন্তন..FACEBOOK:https://www.facebook.com/shourov.sm24.'] },
  { timer: '04:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 04:30 AM - হঠাৎ হঠাৎ মন ভেঙে পড়ে..FACEBOOK:https://www.facebook.com/shourov.sm24.'] },
  { timer: '05:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 05:00 AM - ভোরের আলো আর শান্তি একসাথে আসে না...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '05:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 05:30 AM - ভোরের নিরবতা হৃদয় ভাঙে..FACEBOOK:https://www.facebook.com/shourov.sm24.'] },
  { timer: '06:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 06:00 AM - নতুন সকাল, পুরনো কষ্ট...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '06:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 06:30 AM - মনে পড়ে যাও তোমার হাসি..FACEBOOK:https://www.facebook.com/shourov.sm24.'] },
  { timer: '07:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 07:00 AM - সকালের আলোতে তুমি নেই..FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '07:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 07:30 AM - চা এর কাপে আজও তোমার অভাব...FACEBOOK:https://www.facebook.com/www.xsxx.com365'] },
  { timer: '08:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 08:00 AM - সকালের ব্যস্ততায় কষ্ট হারায় না...FACEBOOK:https://www.facebook.com/www.xsxx.com365'] },
  { timer: '08:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 08:30 AM - তোমার কথা মনে পড়ে...FACEBOOK:https://www.facebook.com/www.xsxx.com365'] },
  { timer: '09:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 09:00 AM - সকাল মানেই তোমার অভাব...FACEBOOK:https://www.facebook.com/www.xsxx.com365'] },
  { timer: '09:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 09:30 AM - ব্যস্ততায়ও তুমি মনে পড়ো..FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '10:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 10:00 AM - ভালোবাসা ছিলো একতরফা..FACEBOOK:https://www.facebook.com/shourov.sm24.'] },
  { timer: '10:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 10:30 AM - দুঃখও কখনো অভ্যাস হয়..FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '11:00:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 11:00 AM - জীবন এক অদ্ভুত যাত্রা...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '11:30:00 AM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 11:30 AM - পুরনো দিনগুলো ফিরিয়ে দাও...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '12:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 12:00 PM - দুপুরে তোমার অভাব বেশি লাগে..FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '12:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 12:30 PM - কিছু স্মৃতি ভুলে যাওয়া যায় না...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '01:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 01:00 PM - হৃদয়ের ব্যথা অদৃশ্য...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '01:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 01:30 PM - একাকীত্ব আমাকে ভালোবাসে...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '02:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 02:00 PM - হৃদয়ের ভেতর আজও কষ্ট...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '02:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 02:30 PM - সবকিছু হারিয়ে ফেলেছি তোমায় খুঁজে...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '03:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 03:00 PM - কিছু ভালোবাসা শুধু মনে থাকে...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '03:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 03:30 PM - মাঝে মাঝে কিছু শব্দও ব্যথা দেয়...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '04:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 04:00 PM - নিঃশব্দ বিকেল আরও নিঃসঙ্গ...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '04:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 04:30 PM - স্মৃতির খাতায় তুমি আজও আছো...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '05:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 05:00 PM - সন্ধ্যার হাওয়ায় কষ্ট উড়ে আসে...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '05:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 05:30 PM - দিন শেষ, কষ্ট শুরু..FACEBOOK:https://www.facebook.com/shourov.sm245'] },
  { timer: '06:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 06:00 PM - তোমার অভাবটা সন্ধ্যায় বেশি টের পাই...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '06:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 06:30 PM - নিঃসঙ্গতা আমার সঙ্গী...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '07:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 07:00 PM - সন্ধ্যার আলোয় হারিয়ে যাই...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '07:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 07:30 PM - কিছু অনুভূতি বোঝানো যায় না...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '08:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 08:00 PM - রাত যত বাড়ে, স্মৃতি তত ফিরে আসে...FACEBOOK:https://www.facebook.com/shourov.sm245'] },
  { timer: '08:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 08:30 PM - তোমার অভাব এখনো কাঁদায়...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '09:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 09:00 PM - রাতের কষ্ট গোপন থাকে না...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '09:30:00 PM', message: ['𝐊𝐈𝐍𝐆 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 09:30 PM - চোখ বন্ধ করলেই তুমি...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '10:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 10:00 PM - চাঁদ দেখে মনে পড়ে তুমি...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '10:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 10:30 PM - রাত মানেই কান্না...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '11:00:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 11:00 PM - তোমার স্মৃতিতে ঘুম হারাম...FACEBOOK:https://www.facebook.com/shourov.sm24'] },
  { timer: '11:30:00 PM', message: ['𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕🖤 11:30 PM - রাতের নিরবতায় শুধুই তুমি...FACEBOOK:https://www.facebook.com/shourov.sm24'] }
];

const formatMessage = (raw) => {
  // header / footer + original content; keeps original message intact but styles it
  const bot = (global.config && global.config.BOTNAME) ? global.config.BOTNAME : "KING SHOUROV";
  const now = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }); // "DD/MM/YYYY, HH:MM:SS"
  const header = `╔═━• ${bot} •━═╗`;
  const footer = `╚═━ ${now.split(",").shift()} • ${now.split(",").pop().trim()} ━═╝`;
  return `${header}\n\n${raw}\n\n${footer}`;
};

// helper: get current Dhaka time string in "hh:mm:ss AM/PM"
const getDhakaTimeString = () => {
  return new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka", hour12: true });
};

let intervalHandle = null;

module.exports.onLoad = (api) => {
  // clear previous interval if any
  try { if (intervalHandle) clearInterval(intervalHandle); } catch(e){}

  // check every 30 seconds
  intervalHandle = setInterval(async () => {
    try {
      const now = getDhakaTimeString(); // e.g. "12:00:00 AM"
      const item = nam.find(i => i.timer === now);
      if (!item) return;

      // build message (choose random if multiple)
      const raw = item.message[Math.floor(Math.random() * item.message.length)];
      const body = formatMessage(raw);

      // ensure global list exists
      const allThreads = Array.isArray(global.data && global.data.allThreadID) ? global.data.allThreadID : [];
      if (!allThreads.length) return;

      // send to each thread safely
      for (const tid of allThreads) {
        try {
          await api.sendMessage(body, tid);
        } catch (errSend) {
          console.warn("autotime: failed to send to", tid, errSend && errSend.message ? errSend.message : errSend);
        }
      }
    } catch (err) {
      console.error("autotime error:", err && (err.stack || err));
    }
  }, 30 * 1000);
};

module.exports.run = async function ({ api, event, args }) {
  // manual trigger: "now" -> send the message for the current time to the current thread (test)
  const sub = (args && args[0]) ? args[0].toLowerCase() : "";
  if (sub === "now") {
    try {
      const now = getDhakaTimeString();
      const item = nam.find(i => i.timer === now);
      if (!item) return api.sendMessage("আজকের টাইমে কোনো মেসেজ সেট নেই (now).", event.threadID);
      const raw = item.message[Math.floor(Math.random() * item.message.length)];
      const body = formatMessage(raw);
      return api.sendMessage(body, event.threadID);
    } catch (e) {
      return api.sendMessage("Test message পাঠাতে সমস্য হয়েছে.", event.threadID);
    }
  }

  // fallback: show usage
  return api.sendMessage("Usage: autotime now  — to test current time message", event.threadID);
};
