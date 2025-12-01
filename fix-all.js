// fix-all.js
'use strict';

const fs = require("fs");
const path = require("path");

const COMMANDS_DIR = path.join(__dirname, "shourov", "commands");
const EVENTS_DIR = path.join(__dirname, "shourov", "events");

const folders = [COMMANDS_DIR, EVENTS_DIR];

function autoFixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const fileName = path.basename(filePath).replace(".js", "");
  let changed = false;

  // Fix missing closing brace
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    content += "\n}";
    changed = true;
  }

  // Fix missing module.exports
  if (!content.includes("module.exports")) {
    content += `
      
module.exports = {
  name: "${fileName}",
  run: async ({ event, api }) => {
    api.sendMessage("${fileName} command working!", event.threadID);
  }
};
`;
    changed = true;
  }

  // Auto-format
  content = content
    .replace(/\t/g, "  ")
    .replace(/\r/g, "");

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("✔ Fixed:", fileName + ".js");
  } else {
    console.log("✓ OK:", fileName + ".js");
  }
}

folders.forEach((folder) => {
  if (!fs.existsSync(folder)) return;

  const files = fs.readdirSync(folder).filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      autoFixFile(path.join(folder, file));
    } catch (err) {
      console.log("❌ ERROR in", file, ":", err.message);
      fs.appendFileSync("fix-errors.log", file + " - " + err.message + "\n");
    }
  }
});

console.log("\n🎯 Auto Fix Completed!");
