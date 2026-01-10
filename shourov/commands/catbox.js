const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "catbox",
    version: "1.0.0",
    permission: 0,
    prefix: true,
    credits: "shourov",
    description: "Upload video/photo/link to catbox.moe and reply link",
    category: "upload",
    usages: "/catbox <reply to video or attach file>"
  },

  run: async function({ api, event }) {
    const { threadID, messageID, attachments, messageReply } = event;

    try {
      let fileUrl = null;

      // 1️⃣ if user replied to a message with attachment
      if (messageReply && messageReply.attachments && messageReply.attachments.length) {
        fileUrl = messageReply.attachments[0].url;
      }
      
      // 2️⃣ if user attached a file directly
      else if (attachments && attachments.length) {
        fileUrl = attachments[0].url;
      }

      if (!fileUrl) {
        return api.sendMessage("⚠️ Please attach or reply to a video/photo to upload.", threadID, messageID);
      }

      // download the file to buffer
      const resp = await axios.get(fileUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(resp.data);

      // prepare form data
      const form = new FormData();
      form.append("reqtype", "fileupload");
      // leave userhash empty for anonymous upload
      form.append("userhash", "");
      form.append("fileToUpload", buffer, "upload.mp4");

      // upload to catbox
      const uploadRes = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders(),
        timeout: 60000
      });

      const resultLink = uploadRes.data.toString().trim();

      // reply the link
      await api.sendMessage(`🔗 Uploaded to Catbox:\n${resultLink}`, threadID, messageID);

    } catch (err) {
      console.error("[catbox] error:", err);
      api.sendMessage("❌ Upload failed. Try again.", threadID, messageID);
    }
  }
};