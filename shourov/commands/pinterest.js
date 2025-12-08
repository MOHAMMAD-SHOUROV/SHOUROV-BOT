// pinterest.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "pinterest",
  version: "1.0.1",
  permission: 0,
  credits: "Nayan | fixed by shourov",
  description: "image search",
  prefix: true,
  category: "with prefix",
  usages: "pinterest (text) - (amount)",
  cooldowns: 10,
  dependencies: {}
};

module.exports.languages = {
  "vi": {
    "missing": "ví dụ: /pinterest phim hoạt hình - 10",
    "noresult": "Không tìm thấy hình ảnh cho: %1",
    "error": "Đã xảy ra lỗi, thử lại sau.",
    "sending": "Đang gửi %1 ảnh cho: %2"
  },
  "en": {
    "missing": "Usage: /pinterest anime - 10",
    "noresult": "No results for: %1",
    "error": "An error occurred, please try again later.",
    "sending": "Sending %1 images for: %2"
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const { threadID, messageID } = event;
  try {
    const raw = args.join(" ").trim();
    if (!raw) return api.sendMessage(getText("missing"), threadID, messageID);

    // Expect format: query - amount
    if (!raw.includes("-")) return api.sendMessage(getText("missing"), threadID, messageID);

    const query = raw.substr(0, raw.indexOf("-")).trim();
    let amount = parseInt(raw.split("-").pop().trim(), 10);
    if (isNaN(amount) || amount <= 0) amount = 6;

    // limit amount to avoid abuse
    const MAX = 12;
    if (amount > MAX) amount = MAX;

    // require the library that provides pinterest search
    let pintarest;
    try {
      pintarest = require('nayan-api-servers').pintarest;
      if (typeof pintarest !== "function") throw new Error("pintarest not a function");
    } catch (e) {
      console.error("pintarest loader error:", e);
      return api.sendMessage("❌ Missing dependency `nayan-api-servers` or it failed to load.", threadID, messageID);
    }

    // call the api
    const res = await pintarest(encodeURIComponent(query));
    // expected: res.data = array of image urls (as in your original)
    const data = res && res.data ? res.data : [];

    if (!Array.isArray(data) || data.length === 0) {
      return api.sendMessage(getText("noresult", query), threadID, messageID);
    }

    // Only take up to `amount` images (but not exceed available)
    const take = Math.min(amount, data.length);
    const attachments = [];
    const tempFiles = [];

    for (let i = 0; i < take; i++) {
      const url = data[i];
      try {
        const r = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
        const extFromUrl = (() => {
          try {
            const parsed = path.parse(new URL(url).pathname);
            let ext = parsed.ext || ".jpg";
            if (!ext || ext.length > 5) ext = ".jpg";
            return ext;
          } catch (e) { return ".jpg"; }
        })();
        const tmp = path.join(__dirname, "cache", `pinterest_${Date.now()}_${i}${extFromUrl}`);
        fs.ensureDirSync(path.dirname(tmp));
        fs.writeFileSync(tmp, Buffer.from(r.data));
        tempFiles.push(tmp);
        attachments.push(fs.createReadStream(tmp));
      } catch (err) {
        console.warn(`Failed to download image ${i} (${url}):`, err.message);
        // skip this image and continue
      }
    }

    if (attachments.length === 0) {
      // cleanup just in case
      for (const tf of tempFiles) {
        try { fs.unlinkSync(tf); } catch (e) {}
      }
      return api.sendMessage(getText("noresult", query), threadID, messageID);
    }

    // Inform user and send attachments
    await api.sendMessage({ body: getText("sending", `${attachments.length}`, query), attachment: attachments }, threadID, (err) => {
      // cleanup files after send (best-effort)
      for (const tf of tempFiles) {
        try { fs.unlinkSync(tf); } catch (e) {}
      }
      if (err) console.error("send message error:", err);
    }, messageID);

  } catch (e) {
    console.error(e);
    try { api.sendMessage(getText("error"), event.threadID, event.messageID); } catch (ex) {}
  }
};