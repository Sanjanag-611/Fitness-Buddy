# 💪 Fitness Buddy — AI Health & Fitness Coach

An AI-powered personal fitness coach web app built with a **vanilla HTML/CSS/JS frontend** and a **Python (Flask) backend**, powered by **IBM Granite** via IBM watsonx.

---

## Features

- 🏠 **Home Workout Plans** — Personalized routines with no equipment needed
- 🔥 **Daily Motivation** — Fitness tips and inspiration to keep you consistent
- 🥗 **Nutrition Guidance** — Simple, healthy meal ideas tailored to your goals
- 📅 **Habit Building** — Strategies for long-term fitness consistency
- ⚡ **Weight Loss Tips** — Effective exercises and advice for fat loss
- 💆 **Recovery Tips** — Post-workout recovery and wellness guidance
- 💬 **Conversational Chat** — Full multi-turn chat with context memory per session

---

## Project Structure

```
Fitness Buddy - Updated/
├── frontend/
│   ├── index.html       # App shell & chat UI
│   ├── style.css        # All styles (responsive, sidebar, chat bubbles)
│   └── app.js           # Chat logic, API calls, markdown formatter
│
├── backend/
│   ├── server.py        # Flask API server
│   ├── requirements.txt # Python dependencies
│   └── .env             # Environment variables (never commit this)
│
└── README.md
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.8 + |
| pip | any recent version |
| IBM watsonx account | with API key and project ID |

---

## Setup & Running

### 1. Clone / download the project

```bash
git clone <your-repo-url>
cd "Fitness Buddy - Updated"
```

### 2. Configure environment variables

Create `backend/.env` from the example values:

```bash
cp backend/.env.example backend/.env   # Linux/macOS
# or on Windows:
copy backend\.env.example backend\.env
```

Open `backend/.env` and fill in your credentials:

```env
IBM_API_KEY=<your-ibm-cloud-api-key>
IBM_URL=https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29
IBM_PROJECT_ID=<your-watsonx-project-id>
IBM_MODEL_ID=ibm/granite-4-h-small
PORT=3000
```

### 3. Install Python dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Start the backend

```bash
python backend/server.py
```

You should see:

```
✅ Fitness Buddy backend running at http://localhost:3000
```

### 5. Open the frontend

Open `frontend/index.html` directly in your browser (no build step required):

```bash
# macOS
open frontend/index.html

# Windows
start frontend\index.html

# or just double-click index.html in File Explorer
```

---

## API Reference

The backend exposes two endpoints on `http://localhost:3000`:

### `POST /api/chat`

Send a conversation turn and receive an AI reply.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Give me a beginner workout plan." }
  ]
}
```

**Response:**
```json
{
  "reply": "Here's a beginner-friendly workout plan you can do at home..."
}
```

**Error response:**
```json
{
  "error": "Failed to get a response from the AI. Please try again."
}
```

### `GET /api/health`

Health check — confirms the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Fitness Buddy backend is running!"
}
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `IBM_API_KEY` | IBM Cloud API key for IAM authentication |
| `IBM_URL` | watsonx text/chat endpoint URL |
| `IBM_PROJECT_ID` | Your watsonx project ID |
| `IBM_MODEL_ID` | Model to use (e.g. `ibm/granite-4-h-small`) |
| `PORT` | Port the Flask server listens on (default: `3000`) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python 3, Flask, flask-cors |
| AI Model | IBM Granite via IBM watsonx |
| Auth | IBM IAM token (cached, auto-refreshed) |

---

## Notes

- The IAM token is automatically fetched and cached; it refreshes 5 minutes before expiry — no manual token management needed.
- Conversation history is maintained **client-side** per session. Refreshing the page starts a new chat.
- The frontend talks to `http://localhost:3000` by default. If you change `PORT`, update the `API_BASE` constant at the top of [`frontend/app.js`](frontend/app.js).
- Never commit your `.env` file. It is listed in `.gitignore`.

---

## Disclaimer

Fitness Buddy provides general wellness information only. Always consult a qualified healthcare or medical professional before starting any new exercise or diet program.
