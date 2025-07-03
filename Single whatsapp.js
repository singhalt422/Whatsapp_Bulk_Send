const express = require('express');
const app = express();

const port = 3000;

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>WhatsApp Desktop Click-to-Chat</title>
<style>
  /* Reset & base */
  * {
    box-sizing: border-box;
  }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f9fafb;
    margin: 0; padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    color: #222;
  }
  .container {
    background: white;
    padding: 2.5rem 3rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    max-width: 420px;
    width: 100%;
    text-align: center;
  }
  h1 {
    margin-bottom: 1.5rem;
    font-weight: 700;
    color: #075E54; /* WhatsApp green */
  }
  input, textarea {
    width: 100%;
    font-size: 1rem;
    padding: 0.75rem 1rem;
    margin: 0.7rem 0 1.2rem 0;
    border: 2px solid #ddd;
    border-radius: 8px;
    transition: border-color 0.3s ease;
    resize: vertical;
    font-family: inherit;
  }
  input:focus, textarea:focus {
    border-color: #25D366; /* WhatsApp bright green */
    outline: none;
    box-shadow: 0 0 8px #25D366aa;
  }
  button {
    background-color: #25D366;
    border: none;
    color: white;
    padding: 0.85rem 1.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    width: 100%;
    transition: background-color 0.3s ease;
  }
  button:hover {
    background-color: #1ebe57;
  }
  button:active {
    background-color: #179e48;
  }
  @media (max-width: 480px) {
    .container {
      padding: 1.5rem 1.8rem;
      max-width: 100%;
      margin: 0 1rem;
    }
  }
</style>
</head>
<body>
  <div class="container">
    <h1>WhatsApp Desktop Click-to-Chat</h1>
    <input id="phone" type="text" placeholder="Phone number (10 digits for India)" autocomplete="off" />
    <textarea id="message" placeholder="Enter your message here"></textarea>
    <button id="sendBtn">Open WhatsApp Desktop</button>
  </div>

  <script>
    document.getElementById('sendBtn').onclick = () => {
      let phone = document.getElementById('phone').value.trim().replace(/\\D/g, '');
      const message = encodeURIComponent(document.getElementById('message').value.trim());

      if (!phone) {
        alert('Please enter a phone number.');
        return;
      }
      if (!message) {
        alert('Please enter a message.');
        return;
      }

      if (phone.length === 10) {
        phone = '91' + phone;
      } else if (phone.length < 10) {
        alert('Phone number is too short.');
        return;
      }

      const waDesktopUrl = \`whatsapp://send?phone=\${phone}&text=\${message}\`;

      window.location.href = waDesktopUrl;
    };
  </script>
</body>
</html>
  `);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
