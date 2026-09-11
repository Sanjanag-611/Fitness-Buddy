import os
import time
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

IBM_API_KEY    = os.getenv("IBM_API_KEY")
IBM_URL        = os.getenv("IBM_URL")
IBM_PROJECT_ID = os.getenv("IBM_PROJECT_ID")
IBM_MODEL_ID   = os.getenv("IBM_MODEL_ID")
PORT           = int(os.getenv("PORT", 3000))

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# IBM IAM token cache
# ---------------------------------------------------------------------------
_cached_token  = None
_token_expiry  = 0   # Unix timestamp


def get_ibm_token() -> str:
    global _cached_token, _token_expiry
    if _cached_token and time.time() < _token_expiry:
        return _cached_token

    resp = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        data={
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": IBM_API_KEY,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    resp.raise_for_status()
    body = resp.json()
    _cached_token = body["access_token"]
    # Expire 5 minutes before the real expiry
    _token_expiry = time.time() + body["expires_in"] - 300
    return _cached_token


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = (
    "You are Fitness Buddy, a friendly and motivating AI-powered health and fitness coach. "
    "Your role is to:\n"
    "- Recommend effective home workouts and exercise routines tailored to the user's fitness level and goals.\n"
    "- Provide motivational tips, daily fitness inspiration, and encouragement to keep users consistent.\n"
    "- Suggest simple, nutritious meal ideas and healthy eating habits.\n"
    "- Help users build positive fitness habits and maintain consistency over time.\n"
    "- Answer questions about exercise form, recovery, hydration, sleep, and overall wellness.\n\n"
    "Always be positive, supportive, and encouraging. Keep responses concise, practical, and actionable. "
    "Use bullet points or numbered lists when listing exercises or meal ideas for clarity. "
    "If a user shares their fitness level or goals, personalize your advice accordingly."
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.post("/api/chat")
def chat():
    body = request.get_json(silent=True) or {}
    messages = body.get("messages")

    if not messages or not isinstance(messages, list):
        return jsonify({"error": "Invalid request: messages array required."}), 400

    try:
        token = get_ibm_token()

        payload = {
            "model_id": IBM_MODEL_ID,
            "project_id": IBM_PROJECT_ID,
            "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages],
            "parameters": {
                "max_new_tokens": 1024,
                "temperature": 0.7,
                "top_p": 0.9,
            },
        }

        resp = requests.post(
            IBM_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()

        reply = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "I'm here to help! Could you clarify your question?")
        )
        return jsonify({"reply": reply})

    except Exception as exc:
        print("IBM API Error:", exc)
        return jsonify({"error": "Failed to get a response from the AI. Please try again."}), 500


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Fitness Buddy backend is running!"})


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print(f"✅ Fitness Buddy backend running at http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=False)
