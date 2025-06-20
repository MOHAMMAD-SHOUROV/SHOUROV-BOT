module.exports.config = {
  name: "joke",
  version: "1.0.0",
  permission: 0,
  credits: "𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  description: "বাংলা মজার জোকস পাঠায়",
  prefix: true,
  category: "fun",
  usages: "",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event }) {
  const jokes = [
    "🥴 শিক্ষক: প্রেম কাকে বলে?\nছাত্র: প্রেম মানে ঝালমুড়ি... শুরুতে টক টক লাগে, পরে কষ্ট দেয়।",
    "😆 পাপ্পু: আমি তো ফিজিক্সে ১০০ তে ১০০ পাইলাম।\nবন্ধু: কি করে?\nপাপ্পু: প্রশ্নই আসেনি!",
    "😂 প্রেমিকা: তুমি কি আমায় ভালোবাসো?\nপ্রেমিক: হ্যাঁ, জীবনের চেয়ে বেশি।\nপ্রেমিকা: প্রমাণ করো।\nপ্রেমিক: তোমার বিয়েতে নাচবো!",
    "😹 শিক্ষক: পরীক্ষায় নকল করলে কী হবে?\nছাত্র: স্যার, রেজাল্ট ভালো হবে।",
    "🤣 ডাক্তার: তোমার কি সমস্যা?\nরোগী: আমি দেখতে পাচ্ছি না!\nডাক্তার: কখন থেকে?\nরোগী: জন্ম থেকে... আমি তো অন্ধ।",
    "😄 ছেলে: বাবা, আমি প্রেমে পড়েছি।\nবাবা: ছেলে হয়ে প্রেমে পড়া মানায় না, দাঁড়িয়ে প্রেম কর!",
    "😆 প্রেমিক: তুমি ছাড়া আমি কিছুই না!\nপ্রেমিকা: ওহ! সত্যি?\nপ্রেমিক: হ্যাঁ! তুমি গেলে আমি ফ্রি হয়ে যাবো!",
    "😂 ছেলে: আব্বু, একটা প্রেম করতে পারি?\nবাবা: না!\nছেলে: দুইটা?\nবাবা: বেয়াদব!",
    "😜 ছাত্র: স্যার, রোল নাম্বার ৫ কেনো সবার আগে যায়?\nস্যার: কারণ ও ৫জি!",
    "🤣 বাবা: খোকা, প্রেম করলে কি হয়?\nখোকা: ডেট শেষ হলে খেতে ইচ্ছা করে!"
  "🤓 শিক্ষক: পরীক্ষায় কী আসবে?\nছাত্র: যেটা আমি পারি না, সেটাই আসবে।",
  "😜 প্রেমিক: তোমাকে দেখলে দম বন্ধ হয়ে আসে!\nপ্রেমিকা: সত্যিই?\nপ্রেমিক: হ্যাঁ, তোমার বাবার সামনে!",
  "🤣 ডাক্তার: আপনি কি নিয়মিত হাঁটেন?\nরোগী: হ্যাঁ, প্রতিদিন স্বপ্নে!",
  "😂 মেয়ে: আমি কি মোটা?\nছেলে: না না... তুমি তো একেবারে থোকা থোকা সৌন্দর্য!",
  "🤣 শিক্ষক: প্রেম কাকে বলে?\nছাত্র: প্রেম মানে সারাদিন চোখে ফোন আর রাতে দুঃখের গান!",
  "😆 পিতা: পরীক্ষা কেমন হলো?\nছেলে: প্রশ্ন ছিল মনের মতো, উত্তর ছিল মনগড়া!",
  "🤣 ছেলে: ভাই, প্রেমে পড়লাম!\nবন্ধু: এখন উঠতেও পারবি না!",
  "😜 ছাত্রী: স্যার, প্রশ্নের উত্তর খাতা থেকে দেখতে পারি?\nস্যার: না!\nছাত্রী: তাহলে খাতা দিয়েন না স্যার!",
  "😂 প্রেমিকা: তোমার কাছে আমি কী?\nপ্রেমিক: লোডশেডিংয়ের পর মোবাইলের চার্জ!",
  "🤣 ছেলে: জীবন মানে কষ্ট!\nবন্ধু: প্রেমে পড়ছিস?\nছেলে: হ্যাঁ রে!",
  "😅 ছাত্রী: স্যার, আপনি সবসময় আমাকে ঘাড় মটকাইয়া চান কেন?\nস্যার: কারণ তুমি হোমওয়ার্ক করোনি!",
  "🤣 শিক্ষক: মোবাইল ছাড়া কি চলা যায়?\nছাত্র: না স্যার, মোবাইল ছাড়লে প্রেমিকাও ছাড়ে!",
  "😂 ডাক্তার: কি হয়েছে?\nরোগী: আমার গার্লফ্রেন্ড চলে গেছে।\nডাক্তার: তাহলে প্রেমই ছেড়ে দাও!",
  "🤣 প্রেমিকা: তুমি কাঁদো কেন?\nপ্রেমিক: তুমি বলেছিলে 'I love you', পরে বললে 'just kidding'!",
  "😹 ছেলে: আমি বিয়ে করতে চাই না!\nবাবা: কেন?\nছেলে: কারণ আমার বউ হয়ে যাবে!",
  "😂 শিক্ষক: প্রেম কাকে বলে?\nছাত্র: ক্লাসে ম্যাডামের চোখে চোখ পড়া এবং খাতা জমা না দিয়ে A+ পাওয়া!",
  "😆 বন্ধু: প্রেম মানে কি?\nআমি: প্রেম মানে ঝালমুড়ি... টেস্টি কিন্তু পেট খারাপ করে দেয়!",
  "🤣 পুলিশ: প্রেমিকার জন্য মারামারি করো কেন?\nছেলে: ভাই, সে আমার মন ছিনতাই করছে!",
  "😜 শিক্ষক: তুমি নামতা মুখস্থ করোনি কেন?\nছাত্র: কারণ গার্লফ্রেন্ড মুখস্থ করতে ব্যস্ত ছিলাম স্যার!",
  "🤣 ছেলে: একবার প্রেমে পড়লে যা হয়, তা আর পরীক্ষায় ফেল হলেও হয় না!",
  ];

  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  const message = `${joke}\n\n🤖 BOT OWNER: 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯`;

  return api.sendMessage(message, event.threadID, event.messageID);
};
