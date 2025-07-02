const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fileUpload = require("express-fileupload");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 8000;

app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// WhatsApp Client
const client = new Client({ authStrategy: new LocalAuth() });

client.on("qr", (qr) => {
    console.log("📱 Scan the QR code below:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("✅ WhatsApp client is ready!");
});

client.initialize();

// Global state
let phoneList = [];
let currentIndex = 0;
let paused = false;
let stopped = false;
let sentCount = 0;
let messageInterval = null;
let currentMessage = "";

// Format phone numbers to include India code
const formatPhoneNumber = (phone) => {
    let number = phone.trim().replace(/[^+\d]/g, "");
    return number.startsWith("+91") ? `91${number.slice(3)}` : `91${number}`;
};

// Message sending loop using setInterval
function startSendingLoop(message) {
    if (messageInterval !== null) return;

    currentMessage = message;

    messageInterval = setInterval(async () => {
        if (paused || stopped || currentIndex >= phoneList.length) {
            clearInterval(messageInterval);
            messageInterval = null;
            return;
        }

        const number = phoneList[currentIndex];
        const chatId = `${number}@c.us`;

        try {
            const isRegistered = await client.isRegisteredUser(number);
            if (isRegistered) {
                await client.sendMessage(chatId, message);
                sentCount++;
                console.log(`✅ Sent to ${number}`);
            } else {
                console.log(`❌ ${number} is not on WhatsApp`);
            }
        } catch (error) {
            console.log(`⚠️ Error sending to ${number}`);
        }

        currentIndex++;
    }, 10000); // send every 10 seconds
}

// Serve HTML UI
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp Sender</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
        .container { max-width: 600px; margin: auto; background: white; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; }
        button { padding: 10px 20px; margin: 10px 5px; border: none; background: #28a745; color: white; cursor: pointer; }
        button:hover { background: #218838; }
        .status { margin-top: 20px; font-size: 1.1em; }
        textarea { width: 100%; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📤 WhatsApp Sender</h1>

        <form id="uploadForm" enctype="multipart/form-data">
            <label>Upload CSV:</label><br>
            <input type="file" name="csvFile" accept=".csv" required><br><br>
            <button type="submit">Upload</button>
        </form>

        <br>
        <label>Message:</label><br>
        <textarea id="message" rows="4" placeholder="Enter your message here..."></textarea><br><br>

        <button onclick="sendAction('/start')">Start</button>
        <button onclick="sendAction('/pause')">Pause</button>
        <button onclick="sendAction('/stop')">Stop</button>
        <button onclick="refreshStatus()">Refresh</button>
        <button onclick="window.location='/download-sample'">Download Sample</button>

        <div class="status" id="statusBox">
            Status will appear here...
        </div>
    </div>

    <script>
        const uploadForm = document.getElementById("uploadForm");
        uploadForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const formData = new FormData(uploadForm);
            const res = await fetch("/upload", { method: "POST", body: formData });
            const text = await res.text();
            alert(text);
        });

        async function sendAction(url) {
            const message = document.getElementById("message").value;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: \`message=\${encodeURIComponent(message)}\`
            });
            const text = await res.text();
            alert(text);
        }

        async function refreshStatus() {
            const res = await fetch("/status");
            const data = await res.json();
            document.getElementById("statusBox").innerText = \`
✅ Sent: \${data.sent} / \${data.total}
⏸️ Paused: \${data.paused}
🛑 Stopped: \${data.stopped}
            \`.trim();
        }
    </script>
</body>
</html>
    `);
});

// Upload CSV
app.post("/upload", (req, res) => {
    if (!req.files || !req.files.csvFile) {
        return res.status(400).send("❌ No file uploaded.");
    }

    const file = req.files.csvFile;
    const uploadPath = path.join(__dirname, "temp.csv");

    file.mv(uploadPath, (err) => {
        if (err) return res.status(500).send("❌ File upload failed.");

        phoneList = [];
        fs.createReadStream(uploadPath)
            .pipe(csv())
            .on("data", (row) => {
                if (row.phone) {
                    phoneList.push(formatPhoneNumber(row.phone));
                }
            })
            .on("end", () => {
                currentIndex = 0;
                sentCount = 0;
                res.send("✅ File uploaded and phone numbers loaded.");
            });
    });
});

// Start
app.post("/start", (req, res) => {
    const message = req.body.message;
    if (!message || phoneList.length === 0) {
        return res.send("❌ Message or phone list missing.");
    }

    if (paused) {
        paused = false;
        res.send("▶️ Resumed message sending.");
        startSendingLoop(currentMessage);
        return;
    }

    // Start fresh
    paused = false;
    stopped = false;
    currentIndex = 0;
    sentCount = 0;
    startSendingLoop(message);
    res.send("🚀 Message sending started.");
});

// Pause
app.post("/pause", (req, res) => {
    paused = true;
    clearInterval(messageInterval);
    messageInterval = null;
    res.send("⏸️ Message sending paused.");
});

// Stop
app.post("/stop", (req, res) => {
    stopped = true;
    paused = false;
    phoneList = [];
    currentIndex = 0;
    sentCount = 0;
    clearInterval(messageInterval);
    messageInterval = null;
    res.send("🛑 Message sending stopped and reset.");
});

// Status check
app.get("/status", (req, res) => {
    res.json({
        total: phoneList.length,
        sent: sentCount,
        remaining: phoneList.length - sentCount,
        paused,
        stopped
    });
});

// Download sample CSV
app.get("/download-sample", (req, res) => {
    const sample = "phone\n9876543210\n9123456789";
    const filePath = path.join(__dirname, "sample.csv");
    fs.writeFileSync(filePath, sample);
    res.download(filePath, "sample.csv");
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
