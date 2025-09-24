const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function getStreamFromURL(url, filename = "file") {
    try {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");

       
        const tempPath = path.join(__dirname, `${filename}_${Date.now()}`);
        fs.writeFileSync(tempPath, buffer);

       
        const stream = fs.createReadStream(tempPath);

        
        stream.on("end", () => {
            try {
                fs.unlinkSync(tempPath);
            } catch (e) {
                console.error("❌ Temp file delete error:", e);
            }
        });

        return stream;
    } catch (err) {
        console.error("❌ getStreamFromURL Error:", err);
        throw err;
    }
}

module.exports = {
    getStreamFromURL
};
