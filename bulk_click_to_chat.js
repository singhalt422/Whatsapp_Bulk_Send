const express = require('express');
const app = express();
const port = 8000;

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Manual WhatsApp Sender</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #e0f7fa, #ffffff);
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .container:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.15);
    }
    h1 {
      text-align: center;
      color: #075E54;
      margin-bottom: 1.5rem;
      font-size: 1.8rem;
    }
    textarea, input, button {
      width: 100%;
      padding: 0.9rem;
      margin-bottom: 1rem;
      border-radius: 8px;
      border: 1px solid #ccc;
      font-size: 1rem;
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    textarea:focus, input:focus {
      border-color: #25D366;
      outline: none;
      box-shadow: 0 0 5px rgba(37, 211, 102, 0.3);
    }
    textarea {
      height: 120px;
      resize: vertical;
    }
    button {
      background-color: #25D366;
      color: white;
      font-weight: bold;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s, transform 0.2s;
    }
    button:hover {
      background-color: #1ebe57;
      transform: scale(1.03);
    }
    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
      transform: none;
    }
    #status {
      text-align: center;
      font-weight: bold;
      color: #444;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Manual WhatsApp Sender</h1>
    <textarea id="numbers" placeholder="📱 Paste 10-digit numbers, one per line"></textarea>
    <textarea id="message" placeholder=" Enter your message here"></textarea>
    <button id="startBtn"> Start</button>
    <button id="sendNextBtn" disabled> Send Next Message</button>
    <div id="status"></div>
  </div>

  <script>
    let phoneList = [];
    let currentIndex = 0;
    let encodedMsg = "";

    const sendNextBtn = document.getElementById('sendNextBtn');
    const status = document.getElementById('status');

    document.getElementById('startBtn').onclick = () => {
      const rawNumbers = document.getElementById('numbers').value.trim();
      const message = document.getElementById('message').value.trim();

      if (!rawNumbers || !message) {
        alert('Please enter phone numbers and message.');
        return;
      }

      phoneList = rawNumbers
        .split('\\n')
        .map(num => num.trim().replace(/\\D/g, ''))
        .filter(num => num.length >= 10)
        .map(num => num.length === 10 ? '91' + num : num);

      if (phoneList.length === 0) {
        alert('No valid phone numbers found.');
        return;
      }

      encodedMsg = encodeURIComponent(message);
      currentIndex = 0;
      status.innerText = \`✅ Ready. Total numbers: \${phoneList.length}\`;
      sendNextBtn.disabled = false;
      sendNextBtn.focus();
    };

    sendNextBtn.onclick = () => {
      if (currentIndex >= phoneList.length) {
        status.innerText = "✅ All messages opened.";
        sendNextBtn.disabled = true;
        return;
      }

      const phone = phoneList[currentIndex];
      const url = \`whatsapp://send?phone=\${phone}&text=\${encodedMsg}\`;

      window.open(url, '_blank');
      currentIndex++;
      status.innerText = \`📨 Opened chat \${currentIndex} of \${phoneList.length}\`;

      setTimeout(() => sendNextBtn.focus(), 100);
    };
  </script>
</body>
</html>
  `);
});

app.listen(port, () => {
  console.log(`📦 App running at http://localhost:${port}`);
});
