import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app) # Allows extension to talk to backend

# Rate limiting: 5 requests per minute per user to prevent abuse
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100 per day", "10 per minute"]
)

HF_TOKEN = os.getenv("HF_TOKEN")
API_URL = "https://api-inference.huggingface.co/models/google-t5/t5-small"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

@app.route("/summarize", methods=["POST"])
@limiter.limit("5 per minute")
def summarize():
    data = request.get_json()
    text = data.get("text", "")

    if not text or len(text) < 50:
        return jsonify({"error": "Text too short (min 50 chars)"}), 400

    if len(text) > 3000:
        return jsonify({"error": "Text too long (max 3000 chars)"}), 400

    try:
        formatted_input = f"summarize: {text}"
        response = requests.post(API_URL, headers=headers, json={"inputs": formatted_input})
        result = response.json()

        print(f"DEBUG: Hugging Face Response -> {result}")

        # If model is loading, HF returns an 'estimated_time'
        if "error" in result and "currently loading" in result["error"]:
            return jsonify({"error": "AI is warming up, try again in 20 seconds"}), 503

        if isinstance(result, list) and len(result) > 0:
            summary = result[0].get("summary_text", "Could not generate summary.")
        else:
            summary = "AI response error. Please try again."
        return jsonify({"summary": summary})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Server error"}), 500

if __name__ == "__main__":
    # Render provides a PORT environment variable. If not found, it uses 5000.
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)