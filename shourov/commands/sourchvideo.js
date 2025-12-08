const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "video",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "search and download short youtube videos (max 25MB)",
  prefix: false,
  category: "Media",
  usages: "user",
  cooldowns: 5,
  dependencies: {
    "ytdl-core": "",
    "simple-youtube-api": ""
  }
};

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

module.exports.handleReply = async function ({ api, event, handleReply }) {
  try {
    const axios = global.nodemodule.axios;
    const fs = global.nodemodule["fs-extra"];

    // load keys list
    const json = await axios.get("https://raw.githubusercontent.com/quyenkaneki/data/main/video.json");
    const keys = json.data.keyVideo;
    if (!Array.isArray(keys) || keys.length === 0) {
      return api.sendMessage("API key list not found.", event.threadID, event.messageID);
    }

    // validate reply
    const choice = event.body.trim();
    if (isNaN(choice)) return api.sendMessage("Please reply with a number (1-12).", event.threadID, event.messageID);
    const idx = parseInt(choice, 10);
    if (idx < 1 || idx > (handleReply.link ? handleReply.link.length : 12)) {
      return api.sendMessage("Choose a number from 1 to 12.", event.threadID, event.messageID);
    }

    // pick random API key object
    const apiObj = keys[Math.floor(Math.random() * keys.length)];
    const videoId = handleReply.link[idx - 1];
    if (!videoId) return api.sendMessage("Video id not found.", event.threadID, event.messageID);

    // request download info from RapidAPI service
    const rapidResp = await axios.request({
      method: "GET",
      url: "https://ytstream-download-youtube-videos.p.rapidapi.com/dl",
      params: { id: videoId },
      headers: {
        "x-rapidapi-host": "ytstream-download-youtube-videos.p.rapidapi.com",
        "x-rapidapi-key": apiObj.API_KEY
      }
    });

    const data = rapidResp.data;
    if (!data || data.status === "fail") return api.sendMessage("This file could not be fetched from the provider.", event.threadID, event.messageID);

    const title = data.title || "Untitled";
    // choose a link entry (pick a non-empty link)
    const linkKeys = Object.keys(data.link || {});
    if (linkKeys.length === 0) return api.sendMessage("No downloadable link found.", event.threadID, event.messageID);

    const firstLink = data.link[linkKeys[1]] ? data.link[linkKeys[1]][0] : data.link[linkKeys[0]][0];
    if (!firstLink) return api.sendMessage("Download link missing.", event.threadID, event.messageID);

    const pathOut = __dirname + "/cache/video_temp.mp4";
    const bin = await axios.get(firstLink, { responseType: "arraybuffer" });
    fs.writeFileSync(pathOut, Buffer.from(bin.data));

    const stats = fs.statSync(pathOut);
    if (stats.size > MAX_SIZE) {
      // cleanup
      fs.unlinkSync(pathOut);
      return api.sendMessage("Can't send the file because it exceeds 25MB.", event.threadID, event.messageID);
    }

    // send
    await api.sendMessage({ body: `✅ ${title}`, attachment: fs.createReadStream(pathOut) }, event.threadID, () => {
      try { fs.unlinkSync(pathOut); } catch (e) {}
    }, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("Không thể gửi file này! (error)", event.threadID, event.messageID);
  } finally {
    // remove cached pngs (1..12) if exist
    try {
      for (let i = 1; i <= 12; i++) {
        const p = __dirname + `/cache/${i}.png`;
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    } catch (e) { /* ignore cleanup errors */ }
  }
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const axios = global.nodemodule.axios;
    const fs = global.nodemodule["fs-extra"];
    const ytsApiModule = global.nodemodule["simple-youtube-api"];
    const json = await axios.get("https://raw.githubusercontent.com/quyenkaneki/data/main/video.json");
    const keys = json.data.keyVideo || [];
    if (!Array.isArray(keys) || keys.length === 0) {
      return api.sendMessage("Key list unavailable.", event.threadID, event.messageID);
    }

    if (!args || args.length === 0) return api.sendMessage("» The search section can't be blank!", event.threadID, event.messageID);
    const query = args.join(" ");

    // if user pasted direct url -> try fetch and send
    if (query.indexOf("https://") === 0) {
      // extract id
      const videoId = query.split(/^.*(youtu.be\/|v\/|embed\/|watch\?|youtube.com\/user\/[^#]*#([^\/]*?\/)*)\??v?=?([^#\&\?]*).*/)[3];
      if (!videoId) return api.sendMessage("Cannot parse video id from url.", event.threadID, event.messageID);

      const apiObj = keys[Math.floor(Math.random() * keys.length)];
      const resp = await axios.request({
        method: "GET",
        url: "https://ytstream-download-youtube-videos.p.rapidapi.com/dl",
        params: { id: videoId },
        headers: {
          "x-rapidapi-host": "ytstream-download-youtube-videos.p.rapidapi.com",
          "x-rapidapi-key": apiObj.API_KEY
        }
      });

      const data = resp.data;
      if (!data || data.status === "fail") return api.sendMessage("This file could not be sent.", event.threadID, event.messageID);

      // choose a link
      const linkKeys = Object.keys(data.link || {});
      const chosen = data.link[linkKeys[1]] ? data.link[linkKeys[1]][0] : data.link[linkKeys[0]][0];
      const outPath = __dirname + "/cache/video_temp.mp4";
      const bin = await axios.get(chosen, { responseType: "arraybuffer" });
      fs.writeFileSync(outPath, Buffer.from(bin.data));

      if (fs.statSync(outPath).size > MAX_SIZE) {
        fs.unlinkSync(outPath);
        return api.sendMessage("Can't send the file because it exceeds 25MB.", event.threadID, event.messageID);
      }

      return api.sendMessage({ body: `» ${data.title || "Video"}`, attachment: fs.createReadStream(outPath) }, event.threadID, () => {
        try { fs.unlinkSync(outPath); } catch (e) {}
      }, event.messageID);
    }

    // Otherwise do search (uses simple-youtube-api)
    // pick a random youtube API key (you may set your own list)
    const ytKeys = [
      "AIzaSyB5A3Lum6u5p2Ki2btkGdzvEqtZ8KNLeXo",
      "AIzaSyAyjwkjc0w61LpOErHY_vFo6Di5LEyfLK0",
      "AIzaSyBY5jfFyaTNtiTSBNCvmyJKpMIGlpCSB4w",
      "AIzaSyCYCg9qpFmJJsEcr61ZLV5KsmgT1RE5aI4"
    ];
    const chosenKey = ytKeys[Math.floor(Math.random() * ytKeys.length)];
    const YouTube = new ytsApiModule(chosenKey);

    const results = await YouTube.searchVideos(query, 12);
    if (!results || results.length === 0) return api.sendMessage("No results found.", event.threadID, event.messageID);

    const links = [];
    const attachments = [];
    let listText = "";

    let idx = 0;
    for (const item of results) {
      idx++;
      links.push(item.id);
      const thumbUrl = `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;
      const imgData = await axios.get(thumbUrl, { responseType: "arraybuffer" });
      const imgPath = __dirname + `/cache/${idx}.png`;
      fs.writeFileSync(imgPath, Buffer.from(imgData.data));
      attachments.push(fs.createReadStream(imgPath));

      // duration fetch (safe)
      let duration = "N/A";
      try {
        const vidInfo = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${item.id}&key=${chosenKey}`);
        const cont = vidInfo.data.items && vidInfo.data.items[0];
        if (cont && cont.contentDetails && cont.contentDetails.duration) {
          // simple cleanup like original code intended
          duration = cont.contentDetails.duration.replace("PT", "").replace("H", ":").replace("M", ":").replace("S", "");
        }
      } catch (e) { /* ignore duration errors */ }

      const marker = ["⓵","⓶","⓷","⓸","⓹","⓺","➐","➑","➒","❿","⓫","⓬"][idx - 1] || `${idx}.`;
      listText += `${marker} 《${duration}》 ${item.title}\n\n`;
    }

    const bodyMsg = `»🔎 There's ${links.length} results matching your search:\n\n${listText}» Reply with the number (1-${links.length}) to select one.`;
    // push handleReply so user can reply
    return api.sendMessage({ attachment: attachments, body: bodyMsg }, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        link: links
      });
    }, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("Không thể xử lý request do đã phát sinh lỗi modul: " + (err.message || err), event.threadID, event.messageID);
  }
};