const axios = require("axios");

module.exports = {
  config: {
    name: "autovideo",
    prefix: false
  },

  handleEvent: async function ({ api, event }) {
    try {
      if (!event.body) return;
      if (event.senderID === api.getCurrentUserID()) return;

      const text = event.body.toLowerCase();

      const API = "https://shourov-video-api.onrender.com/video";
      const res = await axios.get(`${API}?q=${encodeURIComponent(text)}`);

      if (!res.data || res.data.status !== true) return;

      const videoStream = await axios.get(res.data.video, {
        responseType: "stream"
      });

      return api.sendMessage(
        {
          body: res.data.body || "",
          attachment: videoStream.data
        },
        event.threadID,
        event.messageID
      );
    } catch (e) {
      return;
    }
  },

  run() {}
};