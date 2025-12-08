module.exports.config = {
  name: "searchimage",
  version: "1.0.1",
  permission: 0,
  credits: "nayan (adapted shourov)",
  prefix: true,
  description: "search an image",
  category: "with prefix",
  usages: "searchimage [text]",
  cooldowns: 60,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "googlethis": "",
    "cloudscraper": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const axios = global.nodemodule["axios"] || require("axios");
  const google = global.nodemodule["googlethis"] || require("googlethis");
  const cloudscraper = global.nodemodule["cloudscraper"] || require("cloudscraper");
  const fs = global.nodemodule["fs-extra"] || require("fs-extra");
  const path = require("path");

  try {
    // get query: reply text or args
    let query = "";
    if (event.type === "message_reply" && event.messageReply && event.messageReply.body) {
      query = event.messageReply.body;
    } else {
      query = (args || []).join(" ").trim();
    }

    if (!query) {
      return api.sendMessage("কী খুঁজতে চান? /searchimage <text> অথবা কোনো টেক্সট মেসেজ reply করুন।", event.threadID, event.messageID);
    }

    // inform user
    const info = await api.sendMessage(`Searching images for: ${query} ...`, event.threadID, event.messageID);

    // perform google image search (unsafe = false may filter NSFW; keep safe:false if you want all)
    let result = [];
    try {
      result = await google.image(query, { safe: false, limit: 50 });
    } catch (e) {
      console.warn("google.image error:", e && e.message);
      result = [];
    }

    if (!Array.isArray(result) || result.length === 0) {
      await api.unsendMessage(info.messageID).catch(()=>{});
      return api.sendMessage(`আপনার সার্চে কোন ছবি পাওয়া যায় নি: ${query}`, event.threadID, event.messageID);
    }

    // ensure cache dir
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const streams = [];
    let counter = 0;
    const maxShow = 20; // only show up to 20 images
    for (const image of result) {
      if (counter >= maxShow) break;

      // prefer secure fields
      let url = image.url || image.src || image.link || "";
      if (!url) continue;
      url = url.toString();

      // only handle typical image extensions (jpg/png/jpeg)
      if (!(/\.(jpg|jpeg|png)$/i).test(url)) {
        // sometimes URLs without ext still return images — you can attempt to fetch content-type
        // but to stay safe & fast we skip them
        continue;
      }

      const filename = `search-image-${Date.now()}-${counter}.jpg`;
      const filepath = path.join(cacheDir, filename);

      try {
        // cloudscraper to avoid basic blocking
        const buffer = await cloudscraper.get({ uri: url, encoding: null, timeout: 20000 });
        await fs.writeFile(filepath, Buffer.from(buffer));
        // push stream and schedule file deletion on stream end
        const rs = fs.createReadStream(filepath);
        // attach cleanup once stream ends
        rs.on("end", async () => {
          try { if (await fs.pathExists(filepath)) await fs.unlink(filepath); } catch (e) {}
        });
        streams.push(rs);
        counter++;
      } catch (err) {
        console.warn(`failed download image ${url}:`, err && (err.message || err));
        // skip this image
        try { if (await fs.pathExists(filepath)) await fs.unlink(filepath); } catch (e) {}
        continue;
      }
    }

    // unsend searching info
    await api.unsendMessage(info.messageID).catch(()=>{});

    if (streams.length === 0) {
      return api.sendMessage(`সার্চ থেকে উপযোগী কোনো ছবিই ডাউনলোড করা যাচ্ছেনা। (${query})`, event.threadID, event.messageID);
    }

    // send results
    const body = `Image search results for: ${query}\nFound: ${result.length} images, showing: ${streams.length}`;
    await api.sendMessage({ body, attachment: streams }, event.threadID, event.messageID);

    // best-effort: clean any leftover files older than this run (optional)
    // (we already remove per-stream on 'end', but in case of failures)
    try {
      const files = await fs.readdir(cacheDir);
      for (const f of files) {
        if (f.startsWith("search-image-")) {
          const p = path.join(cacheDir, f);
          try {
            const stat = await fs.stat(p);
            // remove files older than 10 minutes
            if ((Date.now() - stat.mtimeMs) > 10 * 60 * 1000) {
              await fs.unlink(p).catch(()=>{});
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      // ignore
    }

  } catch (error) {
    console.error("searchimage error:", error && (error.stack || error));
    try { await api.sendMessage("Internal error while searching images.", event.threadID, event.messageID); } catch (e) {}
  }
};