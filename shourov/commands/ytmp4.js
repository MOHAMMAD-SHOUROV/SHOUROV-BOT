const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");

module.exports = {
  config: {
    name: "ytmp4",
    aliases: ["youtube", "ytvideo"],
    role: 0,
    description: "Download YouTube videos (MP4) — small files will be sent, large ones return link"
  },

  run: async ({ api, event, args }) => {
    const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs");
    const path = (global.nodemodule && global.nodemodule["path"]) ? global.nodemodule["path"] : require("path");

    try {
      if (!args || args.length === 0) {
        return api.sendMessage("❌ Provide a YouTube link.\nUsage: /ytmp4 <youtube_url>", event.threadID);
      }

      const url = args[0].trim();

      // simple validation
      const isYoutube = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/i.test(url);
      if (!isYoutube) {
        return api.sendMessage("❌ Not a valid YouTube URL.", event.threadID);
      }

      // Inform user
      let loadingMsg = null;
      try {
        await new Promise(resolve => {
          api.sendMessage("📥 Preparing download... (this may take a few seconds)", event.threadID, (err, info) => {
            loadingMsg = info;
            resolve();
          });
        });
      } catch (e) {
        // ignore
      }

      // call affiliateplus (or fallback)
      const endpoint = `https://api.affiliateplus.xyz/api/ytdl?url=${encodeURIComponent(url)}&format=mp4`;

      let res;
      try {
        res = await axios.get(endpoint, { timeout: 60000 });
      } catch (err) {
        console.error("ytmp4: affiliateplus request failed:", err && (err.message || err));
        if (loadingMsg && loadingMsg.messageID) {
          try { await api.editMessage("❌ Failed to contact video service. Try again later.", loadingMsg.messageID); } catch (e) {}
        } else {
          try { await api.sendMessage("❌ Failed to contact video service. Try again later.", event.threadID); } catch (e) {}
        }
        return;
      }

      const data = res && res.data ? res.data : null;

      // check shapes commonly returned by affiliateplus
      // typical fields: title, thumbnail, filesize, downloadUrl / url or result or link
      const title = data.title || data.result?.title || "YouTube Video";
      const downloadUrl = data.downloadUrl || data.url || data.result?.url || data.result?.download || data.link || null;
      const filesizeStr = data.filesize || data.size || data.result?.filesize || data.result?.size || null;

      if (!downloadUrl) {
        console.error("ytmp4: no download url in response:", data);
        if (loadingMsg && loadingMsg.messageID) {
          try { await api.editMessage("❌ Service couldn't provide a downloadable URL.", loadingMsg.messageID); } catch (e) {}
        } else {
          try { await api.sendMessage("❌ Service couldn't provide a downloadable URL.", event.threadID); } catch (e) {}
        }
        return;
      }

      // try parse filesize in bytes if available (sometimes like "12.3 MB")
      let filesizeBytes = null;
      if (filesizeStr) {
        const m = String(filesizeStr).match(/([\d\.]+)\s*(KB|MB|GB|B)/i);
        if (m) {
          const val = parseFloat(m[1]);
          const unit = m[2].toUpperCase();
          if (unit === "B") filesizeBytes = val;
          else if (unit === "KB") filesizeBytes = val * 1024;
          else if (unit === "MB") filesizeBytes = val * 1024 * 1024;
          else if (unit === "GB") filesizeBytes = val * 1024 * 1024 * 1024;
        } else {
          // maybe it's bytes already
          const num = Number(filesizeStr);
          if (!Number.isNaN(num)) filesizeBytes = num;
        }
      }

      // threshold for sending file directly (25 MB default)
      const MAX_SEND_BYTES = 25 * 1024 * 1024;

      // If filesize known and is small -> download & send
      if (filesizeBytes && filesizeBytes <= MAX_SEND_BYTES) {
        const tmpDir = path.join(__dirname, "cache");
        try { if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
        const filename = `${Date.now()}_ytmp4.mp4`;
        const filePath = path.join(tmpDir, filename);

        // stream download
        try {
          const dlRes = await axios.get(downloadUrl, { responseType: "stream", timeout: 120000 });
          await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            dlRes.data.pipe(writer);
            let err = null;
            writer.on("error", e => { err = e; writer.close(); reject(e); });
            writer.on("close", () => { if (!err) resolve(); });
          });

          // send
          const body = `✅ Video ready!\n📹 ${title}\n📦 Size: ${Math.round(filesizeBytes / (1024*1024)*100)/100} MB`;
          try {
            await api.sendMessage({ body, attachment: fs.createReadStream(filePath) }, event.threadID);
          } catch (sendErr) {
            console.error("ytmp4: send file failed:", sendErr && (sendErr.stack || sendErr));
            // fallback: send link
            await api.sendMessage(`✅ Video prepared but sending failed. Use this link:\n${downloadUrl}`, event.threadID);
          } finally {
            // cleanup
            try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
            if (loadingMsg && loadingMsg.messageID) {
              try { await api.unsendMessage(loadingMsg.messageID); } catch (e) {}
            }
          }
          return;
        } catch (dle) {
          console.error("ytmp4: streaming download error:", dle && (dle.stack || dle));
          // fallback to send link
          if (loadingMsg && loadingMsg.messageID) {
            try { await api.editMessage(`⚠️ Couldn't download the file. Here's a direct link instead:\n${downloadUrl}`, loadingMsg.messageID); } catch (e) {}
          } else {
            try { await api.sendMessage(`⚠️ Couldn't download the file. Here's a direct link instead:\n${downloadUrl}`, event.threadID); } catch (e) {}
          }
          return;
        }
      }

      // else: filesize unknown or too large -> give direct link & meta
      const sizeReadable = filesizeBytes ? `${Math.round(filesizeBytes / (1024*1024)*100)/100} MB` : "Unknown";
      const outputMsg = `✅ Video info:\n📹 ${title}\n📦 Size: ${sizeReadable}\n🔗 Download link: ${downloadUrl}\n\nNote: If the file is small enough (< ${Math.round(MAX_SEND_BYTES/(1024*1024))}MB) the bot will send it directly.`;

      if (loadingMsg && loadingMsg.messageID) {
        try { await api.editMessage(outputMsg, loadingMsg.messageID); } catch (e) { try { await api.sendMessage(outputMsg, event.threadID); } catch (_) {} }
      } else {
        try { await api.sendMessage(outputMsg, event.threadID); } catch (_) {}
      }

    } catch (err) {
      console.error("ytmp4 command error:", err && (err.stack || err));
      try { await api.sendMessage("❌ An error occurred while processing your request.", event.threadID); } catch (e) {}
    }
  }
};