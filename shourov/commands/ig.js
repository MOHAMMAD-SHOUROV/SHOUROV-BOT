module.exports.config = {
  name: "ig",
  version: "1.0.2",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "Send caption when user sends only /",
  category: "user",
  usages: "/",
  cooldowns: 2
};

module.exports.handleEvent = async ({ api, event }) => {
  const { body, threadID } = event;

  // Trigger ONLY when message is exactly "/"
  if (body !== "/") return;

  const axios = global.nodemodule["axios"];
  const request = global.nodemodule["request"];
  const fs = global.nodemodule["fs-extra"];

  // Captions
  const captions = [
    "“সবাই ছবির পেছনের গল্পটা বোঝে না… কিন্তু হাসিটা দেখে ভাবে সব ঠিক আছে।”",
    "“ভালো থাকার অভিনয়ে ক্লান্ত আমি, তবু চালিয়ে যেতে হয়।” 🥀",
    "“তোমার অবহেলা আমাকে শিখিয়েছে—নিঃশব্দে দূরে চলে যাওয়াই হলো সবচেয়ে বড় শাস্তি!”",
    "হাসতে হাসতে একদিন 😊 সবাইকে কাঁদিয়ে বিদায় নিবো🙂💔🥀",
    "“কষ্ট পেতে পেতে এখন অনুভূতিগুলোও মরে গেছে…❄💔”",
    "“কিছু কথা কাউকে বলা হয় না, শুধু বুকের মধ্যে জমা থেকে যায়…🥀🔒”",
    "“কিছু সম্পর্ক সারাজীবন মনে থেকে যায়…💔📖”",
    "“ফিরে আসার ইচ্ছে থাকলে কেউ হারিয়ে যায় না… 🚶‍♂💔”"
  ];

  // Working image URLs
  const images = [
    "https://i.imgur.com/TrQjWE3.jpeg",
    "https://i.imgur.com/oFEU2Vz.jpeg",
    "https://i.imgur.com/nO4DlWN.jpeg",
    "https://i.imgur.com/uj4d3HT.jpeg",
    "https://i.imgur.com/YgQqzqZ.jpeg",
    "https://i.imgur.com/vFn1Oao.jpeg"
  ];

  const caption = captions[Math.floor(Math.random() * captions.length)];
  const imgURL = images[Math.floor(Math.random() * images.length)];
  const filePath = __dirname + "/cache/islm_pic.jpg";

  request(imgURL)
    .pipe(fs.createWriteStream(filePath))
    .on("close", () => {
      api.sendMessage(
        {
          body: `✨ SHOUROV-BOT ✨\n\n${caption}`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlinkSync(filePath)
      );
    });
};

module.exports.run = async () => {};
