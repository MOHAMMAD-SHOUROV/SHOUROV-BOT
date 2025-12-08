module.exports.config = {
  name: "hot",
  version: "1.0.0",
  permission: 0,
  credits: "shourov (adapted)",
  description: "Random hot video",
  prefix: true,
  category: "Media",
  usages: "",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.run = async function({ api, event }) {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const request = global.nodemodule["request"];
  const { threadID, messageID } = event;

  try {
    // ensure cache dir
    const cacheDir = __dirname + "/cache";
    await fs.ensureDir(cacheDir);
    const outPath = cacheDir + "/15.mp4";

    // list of candidate video URLs (Google Drive direct-download style or any direct file URL)
    const videos = [
      "https://drive.google.com/uc?id=1aF6H24ILE6wIFGW3M3BGXg8l63ktP8B3",
      "https://drive.google.com/uc?id=1c6SCqToTZamfuiiz5LrckOxDYT9gnJGu",
      "https://drive.google.com/uc?id=1jsoQ4wuRdN6EP6jOE3C0L6trLZmoPI0L",
      "https://drive.google.com/uc?id=1bcIoyM9T_wQlaXxar4nVjCXsKHavRmnb",
      "https://drive.google.com/uc?id=1bs5sI8NDRVK_omefR59how1UjZ6TEu91",
      "https://drive.google.com/uc?id=1_ysGMbGZQexheta6tuSBhJQDeAMioXr_",
      "https://drive.google.com/uc?id=1t2oFQmOtw-6V_ahWzYo08v1g2oGnkhPL",
      "https://drive.google.com/uc?id=1bv8GL0XDReocf1NfZBMCNoMAsBBwDE1i",
      "https://drive.google.com/uc?id=1ta1ujBjmcvxSuYVwQ3oEXIJsnPCW2VZO",
      "https://drive.google.com/uc?id=1brkBa03NdRCx6lfrjopbWJUCoJupCRYg",
      "https://drive.google.com/uc?id=1seUwXvoVFyCzOA5SykF9uxhlwuwLzPn0",
      "https://drive.google.com/uc?id=1b_evUu8zmfiPs-CeaZp1DkkArB5zl5x-",
      "https://drive.google.com/uc?id=1bTwYfovA2YKCs_kskWyp2GHh7K9XHQN0",
      "https://drive.google.com/uc?id=1jr4YzPNCTOj_lfdOSnauXfTPJkbuqS3f",
      "https://drive.google.com/uc?id=1a7XsNXizFTTlSD_gRQwK4bDA3HPam56W",
      "https://drive.google.com/uc?id=1bPdkmq6lKm8BGwxkWaADHe0kutTtEujR",
      "https://drive.google.com/uc?id=1tqaCw0vfG2zJDijgsFF2UTlOB-EmI4SZ",
      "https://drive.google.com/uc?id=1c5YXcgK3kOx6bTfVjxNGGMdDYbGmVInC",
      "https://drive.google.com/uc?id=1svD1h3vEYbwxMeU5v4c2wQPBaU90fcEx",
      "https://drive.google.com/uc?id=1boVaYpbxIH3RItPY6k0Ld2F98YasHVq9"
    ];

    // pick random url
    const idx = Math.floor(Math.random() * videos.length);
    const url = videos[idx];

    // download stream to file (use request to preserve streaming)
    await new Promise((resolve, reject) => {
      const stream = request(encodeURI(url)).pipe(fs.createWriteStream(outPath));
      stream.on("finish", resolve);
      stream.on("error", (err) => {
        // cleanup on error
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
        reject(err);
      });
    });

    // send message with attachment
    const body = "「 Random hot video 」";
    await api.sendMessage({ body, attachment: fs.createReadStream(outPath) }, threadID, (err) => {
      // cleanup file after send
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) { console.warn("cleanup failed:", e && e.message); }
      if (err) console.error("sendMessage error:", err);
    }, messageID);

  } catch (error) {
    console.error("hot command error:", error && (error.stack || error));
    // try to remove temp file if exists
    try { const tmp = __dirname + "/cache/15.mp4"; if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (e) {}
    return api.sendMessage("কোনো সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।", event.threadID, event.messageID);
  }
};