module.exports.config = {
  name: "add",
  version: "1.0.0",
  permission: 0,
  prefix: true,
  credits: "Nayan | Fixed by Shourov",
  description: "Add video to API database",
  category: "user",
  usages: "Reply a video → /add yourname",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID } = event;

  // Must input name
  if (!args[0]) {
    return api.sendMessage(
      `❗ Usage: Reply to a video → ${global.config.PREFIX}add your_name`,
      threadID,
      messageID
    );
  }

  // Must reply to a message
  if (!event.messageReply) {
    return api.sendMessage("❗ Please reply to a video.", threadID, messageID);
  }

  // Must contain attachments
  if (!event.messageReply.attachments || event.messageReply.attachments.length === 0) {
    return api.sendMessage("❗ The reply must contain a video file.", threadID, messageID);
  }

  // Filter video files
  const videos = event.messageReply.attachments.filter(a => a.type === "video");
  if (videos.length === 0) {
    return api.sendMessage("❗ Only video files are accepted.", threadID, messageID);
  }

  try {
    // Load API JSON
    const apiConfig = await axios.get(
      "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json"
    );
    const apiUrl = apiConfig.data.api;

    let uploadedLinks = [];

    // Upload each video to imgur API
    for (const video of videos) {
      const cleanUrl = encodeURIComponent(video.url.replace(/\s/g, ""));
      const uploadResult = await axios.get(`${apiUrl}/imgur?url=${cleanUrl}`);
      uploadedLinks.push(uploadResult.data.link);
    }

    const name = args.join(" ");

    // Send to Nayan API DB
    const finalUrl = encodeURIComponent(uploadedLinks.join(","));
    const finalName = encodeURIComponent(name);

    const result = await axios.get(
      `${apiUrl}/mixadd?name=${finalName}&url=${finalUrl}`
    );

    const msg = result.data.msg || "Success";
    const userName = result.data.data?.name || name;
    const storedUrl = result.data.data?.url || "No URL returned";

    return api.sendMessage(
      `✨ **Video Added Successfully**\n\n📩 Message: ${msg}\n📛 Name: ${userName}\n🖇 URL: ${storedUrl}`,
      threadID,
      messageID
    );

  } catch (err) {
    console.log("ADD VIDEO ERROR:", err.message);
    return api.sendMessage(
      "⚠️ Error occurred while adding video. Try again later.",
      threadID,
      messageID
    );
  }
};