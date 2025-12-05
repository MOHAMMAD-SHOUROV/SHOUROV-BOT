// commands/ownerinfo.js
module.exports = {
  config: {
    name: "ownerinfo",
    version: "1.0.0",
    author: "ALIHSAN SHOUROV",
    countDown: 5,
    role: 0,
    shortDescription: "bot owner info",
    longDescription: "Send bot owner & group info when triggered (auto)",
    category: "auto ✅"
  },

  /**
   * onStart will be called by some frameworks when an event triggers the module.
   * Signature adapted from the obfuscated module you provided:
   * onStart({ event, message, usersData, threadsData })
   */
  onStart: async function({ event, message, usersData, threadsData }) {
    try {
      // get sender (user) name
      const userData = await usersData.get(event.senderID);
      const senderName = userData?.name || "Unknown";

      // get thread (group) data
      const threadData = await threadsData.get(event.threadID);
      const threadName = threadData?.name || "Unknown Group";

      // current date/time formatted for Asia/Dhaka
      const now = new Date();
      const dateString = now.toLocaleDateString("en-GB", { year: "numeric", month: "numeric", day: "numeric" }); // D/M/YYYY
      const timeString = now.toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka", hour12: false });

      // message body (you can edit details below)
      const body = [
        `╔╝❮ ${senderName} ❯╚╗`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `𝐍𝐀𝐌𝐄:  𝐊𝐈𝐍𝐆 𝐒𝐇𝐎𝐔𝐑𝐎𝐕`,
        ``,
        `𝐑𝐄𝐋𝐈𝐆𝐈𝐎𝐍:  𝐈𝐒𝐋𝐀𝐌`,
        ``,
        `𝐀𝐃𝐃𝐑𝐄𝐒𝐒:  𝐁𝐎𝐆𝐔𝐑𝐀, 𝐁𝐀𝐍𝐆𝐋𝐀𝐃𝐄𝐒𝐇`,
        ``,
        `𝐆𝐄𝐍𝐃𝐄𝐑:  𝐌𝐀𝐋𝐄`,
        ``,
        `𝐀𝐆𝐄:  18+`,
        ``,
        `𝐑𝐄𝐋𝐀𝐓𝐈𝐎𝐍𝐒𝐇𝐈𝐏:  Failed`,
        ``,
        `𝐆𝐌𝐀𝐈𝐋:  shourovislam5430@gmail.com`,
        ``,
        `𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊:  https://www.facebook.com/www.xsxx.com365`,
        ``,
        `𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏:  wa.me/+8801709281334`,
        ``,
        `𝐈𝐌𝐎:  PERSONAL`,
        ``,
        `𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌:  t.me/`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `Bot Prefix: ( / )`,
        `Bot Name: SHOUROV BOT`,
        ``,
        `Group Name: ${threadName}`,
        `Time: 【 ${dateString} || ${timeString} 】`,
      ].join("\n");

      // image to attach (same as obfuscated link)
      const imageUrl = "https://i.postimg.cc/kXFmkXL3/1748717070130.jpg";

      // global.utils.getStreamFromURL is used in your botbase repeatedly — use it to fetch stream.
      // If your framework doesn't have it, replace with global.request or axios stream.
      const stream = (global.utils && typeof global.utils.getStreamFromURL === "function")
        ? await global.utils.getStreamFromURL(imageUrl)
        : null;

      // reply with body + image (if possible)
      if (stream) {
        await message.reply({ body, attachment: stream });
      } else {
        // fallback: send message without attachment if getStreamFromURL not available
        await message.reply({ body });
      }
    } catch (err) {
      console.error("ownerinfo onStart error:", err);
      // fail silently or notify admin
    }
  }
};