/**
 * imagine.js
 * Adapted to your bot loader style (uses global.nodemodule and safe handling)
 */

module.exports = {
  config: {
    name: "imagine",
    version: "1.0.1",
    permission: 0,
    credits: "Nayan",
    description: "Generate images from prompt (via external API)",
    prefix: true,
    category: "prefix",
    usages: "imagine <prompt>",
    cooldowns: 10,
    dependencies: {
      "axios": "",
      "fs-extra": ""
    }
  },

  languages: {
    "vi": {},
    "en": {
      "missing": "use : /imagine cat",
      "waiting": "Generating images... please wait a moment.",
      "noapi": "API base not found (api.json).",
      "noimages": "No images returned from the API.",
      "error": "An error occurred while creating images."
    }
  },

  // for compatibility with your other modules that call start(...)
  start: async function({ nayan, events, args, lang }) {
    // delegate to run implementation below for consistency
    return this.run({ api: nayan, event: events, args, lang });
  },

  // main entrypoint matching many of your modules' conventions
  run: async function({ api, event, args, lang }) {
    const axios = global.nodemodule && global.nodemodule["axios"] ? global.nodemodule["axios"] : require("axios");
    const fs = global.nodemodule && global.nodemodule["fs-extra"] ? global.nodemodule["fs-extra"] : require("fs-extra");
    try {
      const prompt = (args || []).join(" ").trim();

      if (!prompt) {
        const msg = (lang && lang("missing")) || "use : /imagine cat";
        return api.sendMessage(msg, event.threadID, event.messageID);
      }

      // fetch API base from remote JSON (same pattern as your other modules)
      let apiBase = null;
      try {
        const apisResp = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json", { timeout: 10000 });
        apiBase = apisResp && apisResp.data && apisResp.data.api ? apisResp.data.api : null;
      } catch (e) {
        apiBase = null;
      }

      if (!apiBase) {
        const m = (lang && lang("noapi")) || "API base not found (api.json).";
        return api.sendMessage(m, event.threadID, event.messageID);
      }

      // inform user
      const waitMessage = (lang && lang("waiting")) || "Generating images... please wait a moment.";
      const infoMsg = await api.sendMessage(waitMessage, event.threadID, event.messageID);

      // call external image generation endpoint
      const endpoint = `${apiBase}/nayan/img?prompt=${encodeURIComponent(prompt)}`;
      const res = await axios.get(endpoint, { timeout: 120000 }); // allow longer timeout

      if (!res || !res.data) {
        await api.unsendMessage(infoMsg.messageID).catch(() => {});
        return api.sendMessage((lang && lang("error")) || "An error occurred while creating images.", event.threadID, event.messageID);
      }

      // expect res.data.imageUrls (array)
      const images = res.data.imageUrls || res.data.images || [];
      if (!Array.isArray(images) || images.length === 0) {
        await api.unsendMessage(infoMsg.messageID).catch(() => {});
        return api.sendMessage((lang && lang("noimages")) || "No images returned from the API.", event.threadID, event.messageID);
      }

      // prepare cache dir
      const cacheDir = __dirname + "/cache";
      await fs.ensureDir(cacheDir);

      // download images (limit to reasonable number e.g., 6)
      const maxImages = Math.min(images.length, 6);
      const attachments = [];
      for (let i = 0; i < maxImages; i++) {
        try {
          const imageUrl = images[i];
          const pathFile = `${cacheDir}/imagine_${Date.now()}_${i}.jpg`;
          const resp = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 600