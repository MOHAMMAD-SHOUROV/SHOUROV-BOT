// commands/youtube.js
module.exports.config = {
  name: "youtube",
  version: "1.1.0",
  permission: 0,
  credits: "shourov",
  description: "Search & download YouTube video (uses RapidAPI video service + YouTube search fallback)",
  prefix: true,
  category: "Media",
  usages: "Link or search keywords",
  cooldowns: 5
};

const PATH = require("path");

module.exports.handleReply = async function ({ api, event, handleReply }) {
  try {
    const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
    const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
    const cacheDir = PATH.join(__dirname, "cache");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const choice = (event.body || "").trim();
    if (!choice || isNaN(choice)) return api.sendMessage("Choose from 1 -> 6, baby ❤️", event.threadID, event.messageID);

    const idx = parseInt(choice, 10);
    if (idx < 1 || idx > (handleReply.link ? handleReply.link.length : 6)) return api.sendMessage("Choose from 1 -> 6, baby ❤️", event.threadID, event.messageID);

    // fetch video.json (which contains RapidAPI keys)
    const metaResp = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-SHOUROV/shourovbot/main/video.json").catch(()=>null);
    if (!metaResp || !metaResp.data || !Array.isArray(metaResp.data.keyVideo) || metaResp.data.keyVideo.length === 0) {
      return api.sendMessage("⚠️ Video service config not available. Ask the bot owner to add API keys.", event.threadID, event.messageID);
    }
    const keys = metaResp.data.keyVideo;
    const pick = keys[Math.floor(Math.random() * keys.length)];
    if (!pick || !pick.API_KEY) return api.sendMessage("⚠️ No API key available in remote config.", event.threadID, event.messageID);

    const videoId = handleReply.link[idx - 1];
    if (!videoId) return api.sendMessage("Invalid selection.", event.threadID, event.messageID);

    // call RapidAPI endpoint
    const options = {
      method: "GET",
      url: "https://ytstream-download-youtube-videos.p.rapidapi.com/dl",
      params: { id: videoId },
      headers: {
        "x-rapidapi-host": "ytstream-download-youtube-videos.p.rapidapi.com",
        "x-rapidapi-key": pick.API_KEY
      },
      timeout: 60000
    };

    const resp = await axios.request(options).catch(()=>null);
    if (!resp || !resp.data) return api.sendMessage("Unable to fetch video info.", event.threadID, event.messageID);
    const p = resp.data;
    if (p.status && p.status === "fail") return api.sendMessage("Cannot send this file.", event.threadID, event.messageID);

    // choose a link from response
    const keysLinks = Object.keys(p.link || {});
    if (keysLinks.length === 0) return api.sendMessage("No downloadable links found.", event.threadID, event.messageID);
    // pick a quality key (prefer second like original code did)
    const keyForLink = keysLinks[ keysLinks.length > 1 ? 1 : 0 ];
    const downloadUrl = Array.isArray(p.link[keyForLink]) ? p.link[keyForLink][0] : p.link[keyForLink];

    if (!downloadUrl) return api.sendMessage("No download URL.", event.threadID, event.messageID);

    const outPath = PATH.join(cacheDir, "1.mp4");

    // stream download
    const fileBuf = (await axios.get(downloadUrl, { responseType: "arraybuffer", timeout: 120000 }).catch(()=>null));
    if (!fileBuf || !fileBuf.data) return api.sendMessage("Failed to download file.", event.threadID, event.messageID);
    fs.writeFileSync(outPath, Buffer.from(fileBuf.data));

    const stat = fs.statSync(outPath);
    const size = stat.size;
    const MAX = 25 * 1024 * 1024; // 25 MB

    // unsend the menu message (if exists)
    try { if (handleReply.messageID) api.unsendMessage(handleReply.messageID); } catch(e){}

    if (size > MAX) {
      // cleanup and inform user
      try { fs.unlinkSync(outPath); } catch (e) {}
      return api.sendMessage("The file could not be sent because it is larger than 25MB.", event.threadID, event.messageID);
    }

    // send file
    await api.sendMessage({ body: `» ${p.title || "YouTube Video"}`, attachment: fs.createReadStream(outPath) }, event.threadID, () => {
      try { fs.unlinkSync(outPath); } catch(e) {}
    }, event.messageID);

  } catch (err) {
    console.error("youtube.handleReply error:", err && (err.stack || err));
    try { return api.sendMessage("An error occurred while processing your selection.", event.threadID, event.messageID); } catch(e) {}
  }
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
    const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
    const path = PATH;
    const createReadStream = fs.createReadStream;

    const text = (args || []).join(" ").trim();
    if (!text) return api.sendMessage("» Search cannot be left blank!", event.threadID, event.messageID);

    // if the user gave a direct youtube link -> try immediate download (same flow as handleReply's branch)
    const isLink = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(text);

    // load remote video.json for RapidAPI keys
    const metaResp = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-SHOUROV/shourovbot/main/video.json").catch(()=>null);
    if (!metaResp || !metaResp.data || !Array.isArray(metaResp.data.keyVideo) || metaResp.data.keyVideo.length === 0) {
      // still we can attempt a search using simple-youtube-api if available, else fail gracefully
      // continue but notify
      // (we won't abort here — we'll try to fallback)
    }
    const keysArr = (metaResp && metaResp.data && Array.isArray(metaResp.data.keyVideo)) ? metaResp.data.keyVideo : [];
    const randomKey = keysArr.length ? keysArr[Math.floor(Math.random() * keysArr.length)] : null;

    // If link -> call rapidapi to get downloadable link immediately
    if (isLink) {
      // extract id
      const idMatch = text.split(/^.*(youtu.be\/|v\/|embed\/|watch\?|youtube.com\/user\/[^#]*#([^\/]*?\/)*)\??v?=?([^#\&\?]*).*/)[3];
      if (!idMatch) return api.sendMessage("Invalid YouTube link.", event.threadID, event.messageID);

      if (!randomKey || !randomKey.API_KEY) return api.sendMessage("No RapidAPI key available to download. Try search instead.", event.threadID, event.messageID);

      const options = {
        method: "GET",
        url: "https://ytstream-download-youtube-videos.p.rapidapi.com/dl",
        params: { id: idMatch },
        headers: {
          "x-rapidapi-host": "ytstream-download-youtube-videos.p.rapidapi.com",
          "x-rapidapi-key": randomKey.API_KEY
        },
        timeout: 60000
      };
      const resp = await axios.request(options).catch(()=>null);
      if (!resp || !resp.data) return api.sendMessage("Unable to get video from service.", event.threadID, event.messageID);
      const p = resp.data;
      if (p.status === "fail") return api.sendMessage("Unable to send this file.", event.threadID, event.messageID);

      const keysLinks = Object.keys(p.link || {});
      const chosenKey = keysLinks.length > 1 ? keysLinks[1] : keysLinks[0];
      const downloadUrl = Array.isArray(p.link[chosenKey]) ? p.link[chosenKey][0] : p.link[chosenKey];
      if (!downloadUrl) return api.sendMessage("No download url found.", event.threadID, event.messageID);

      // download and send small file (delegated to handleReply logic)
      // reuse handleReply logic by emulating a handleReply object
      const fakeHandleReply = { link: [idMatch], messageID: null };
      return module.exports.handleReply({ api, event, handleReply: fakeHandleReply });
    }

    // Otherwise: perform search using simple-youtube-api if available
    let YouTube = null;
    try { YouTube = (global.nodemodule && global.nodemodule["simple-youtube-api"]) ? global.nodemodule["simple-youtube-api"] : require("simple-youtube-api"); } catch(e) { YouTube = null; }

    // If no simple-youtube-api, try using YouTube Data API v3 via google API key (random small pool)
    const googleKeys = ["AIzaSyB5A3Lum6u5p2Ki2btkGdzvEqtZ8KNLeXo","AIzaSyAyjwkjc0w61LpOErHY_vFo6Di5LEyfLK0","AIzaSyBY5jfFyaTNtiTSBNCvmyJKpMIGlpCSB4w","AIzaSyCYCg9qpFmJJsEcr61ZLV5KsmgT1RE5aI4"];
    const gKey = googleKeys[Math.floor(Math.random() * googleKeys.length)];

    if (!YouTube) {
      // fallback: use google API search (simple)
      const searchResp = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: { part: "snippet", q: text, maxResults: 6, key: gKey, type: "video" }
      }).catch(()=>null);

      if (!searchResp || !searchResp.data || !Array.isArray(searchResp.data.items)) {
        return api.sendMessage("Search failed (no search module & google API).", event.threadID, event.messageID);
      }

      const items = searchResp.data.items;
      const links = [];
      const attachments = [];
      let menuText = "»🔎 Search results:\n\n";
      const axiosLocal = axios;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const vid = it.id.videoId;
        links.push(vid);
        const thumbUrl = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
        const thumbBuf = (await axiosLocal.get(thumbUrl, { responseType: "arraybuffer" }).catch(()=>null));
        const thumbPath = PATH.join(__dirname, "cache", `${i+1}.jpg`);
        if (thumbBuf && thumbBuf.data) {
          fs.writeFileSync(thumbPath, Buffer.from(thumbBuf.data));
          attachments.push(fs.createReadStream(thumbPath));
        }
        const durationResp = await axiosLocal.get(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${vid}&key=${gKey}`).catch(()=>null);
        const duration = (durationResp && durationResp.data && durationResp.data.items && durationResp.data.items[0]) ? (durationResp.data.items[0].contentDetails.duration || "") : "";
        menuText += `${["⓵","⓶","⓷","⓸","⓹","⓺"][i] || (i+1)} 《${duration.replace("PT","").replace("S","s")}》 ${it.snippet.title}\n\n`;
      }

      menuText += "» Please reply (reply by number) choose one of the above searches";
      // push to handleReply so user can reply with number
      return api.sendMessage({ attachment: attachments, body: menuText }, event.threadID, (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          link: links
        });
      }, event.messageID);
    } else {
      // use simple-youtube-api if present
      const YoutubeClient = new YouTube(gKey);
      const results = await YoutubeClient.searchVideos(text, 6).catch(()=>null);
      if (!results || !results.length) return api.sendMessage("No results found.", event.threadID, event.messageID);

      const links = [];
      const attachments = [];
      let menuText = "»🔎 Search results:\n\n";
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        links.push(r.id);
        const thumbUrl = `https://img.youtube.com/vi/${r.id}/hqdefault.jpg`;
        const thumbBuf = (await axios.get(thumbUrl, { responseType: "arraybuffer" }).catch(()=>null));
        const thumbPath = PATH.join(__dirname, "cache", `${i+1}.jpg`);
        if (thumbBuf && thumbBuf.data) fs.writeFileSync(thumbPath, Buffer.from(thumbBuf.data));
        attachments.push(fs.createReadStream(thumbPath));
        // duration might be available as r.duration or require additional fetch; we'll display placeholder
        menuText += `${["⓵","⓶","⓷","⓸","⓹","⓺"][i] || (i+1)} ${r.title}\n\n`;
      }

      menuText += "» Please reply (reply by number) choose one of the above searches";
      return api.sendMessage({ attachment: attachments, body: menuText }, event.threadID, (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          link: links
        });
      }, event.messageID);
    }

  } catch (err) {
    console.error("youtube.run error:", err && (err.stack || err));
    try { return api.sendMessage("The request could not be processed due to an error.", event.threadID, event.messageID); } catch(e) {}
  }
};