module.exports.config = {
  name: "life",
  version: "1.0.0",
  permission: 0,
  credits: "BOT OWNER 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  description: "জীবন নিয়ে কিছু কথা",
  prefix: true,
  category: "emotion",
  usages: "life",
  cooldowns: 5,
};

module.exports.run = async ({ api, event }) => {
  const quotes = [
    "জীবনে কখনো হাল ছাড়বে না, কারণ অন্ধকারের পরেই আলো আসে।",
    "ভুল থেকে শিক্ষা নিয়ে সামনে এগিয়ে যাওয়াটাই আসল জীবন।",
    "যে জীবনটা তুমি বাঁচো, সেটা কারো অনুকরণ নয়, নিজের তৈরি হওয়া উচিত।",
    "জীবনের প্রতিটি মুহূর্তকে ভালোবাসো, কারণ সেটা আর ফিরে আসবে না।",
    "সফলতা কষ্ট দিয়ে গড়ে ওঠে, অলসতা দিয়ে নয়।"
  ];
  const msg = quotes[Math.floor(Math.random() * quotes.length)] + "\n\n🔰 BOT OWNER 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯";
  return api.sendMessage(msg, event.threadID,
