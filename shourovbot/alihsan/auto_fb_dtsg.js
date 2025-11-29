const fs = require('fs');
const fetch = require('node-fetch');

function getCookies(fbstate) {
  let cookies = [];
  fbstate.forEach(c => {
    if (c.key && c.value) cookies.push(`${c.key}=${c.value}`);
  });
  return cookies.join('; ');
}

async function generate() {
  if (!fs.existsSync("fbstate.json")) {
    console.log("fbstate.json file not found!");
    return;
  }

  const fbstate = JSON.parse(fs.readFileSync("fbstate.json", "utf8"));
  const cookieHeader = getCookies(fbstate);

  let userId = fbstate.find(x => x.key === "c_user")?.value || "unknown";

  const res = await fetch("https://m.facebook.com/", {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Cookie": cookieHeader
    }
  });

  const html = await res.text();

  const dtsg = html.match(/name="fb_dtsg" value="([^"]+)"/);
  const jazoest = html.match(/name="jazoest" value="([^"]+)"/);

  if (!dtsg) {
    console.log("Cannot extract fb_dtsg. Maybe session expired.");
    return;
  }

  const output = {};
  output[userId] = {
    fb_dtsg: dtsg[1],
    jazoest: jazoest ? jazoest[1] : '0'
  };

  fs.writeFileSync("fb_dtsg_data.json", JSON.stringify(output, null, 2));
  console.log("✔ fb_dtsg_data.json updated successfully!");
}

generate();
