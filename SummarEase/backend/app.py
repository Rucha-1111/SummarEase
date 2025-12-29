import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100 per day", "10 per minute"]
)

HF_TOKEN = os.getenv("HF_TOKEN")

API_URL = "https://api-inference.huggingface.co/models/google-t5/t5-small"
HEADERS = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

@app.route("/summarize", methods=["POST"])
@limiter.limit("5 per minute")
def summarize():
    data = request.get_json(force=True)
    text = data.get("text", "").strip()

    # ✅ Character-based validation (MATCH FRONTEND)
    if len(text) < 200:
        return jsonify({"error": "Text too short (min 200 characters)"}), 400

    if len(text) > 3000:
        return jsonify({"error": "Text too long (max 3000 characters)"}), 400

    payload = {
        "inputs": f"summarize: {text}",
        "parameters": {
            "max_length": 120,
            "min_length": 40,
            "do_sample": False
        }
    }

    try:
        response = requests.post(
            API_URL,
            headers=HEADERS,
            json=payload,
            timeout=12  # 🚀 prevents hanging
        )

        result = response.json()

        # 🧠 Model loading / overload
        if isinstance(result, dict) and "error" in result:
            if "loading" in result["error"].lower():
                return jsonify({
                    "error": "AI warming up. Try again in 10–15 seconds."
                }), 503
            return jsonify({"error": result["error"]}), 500

        summary = result[0].get("summary_text", "").strip()

        if not summary:
            return jsonify({"error": "Empty AI response"}), 500

        return jsonify({"summary": summary})

    except requests.exceptions.Timeout:
        return jsonify({"error": "AI timed out. Try again."}), 504

    except Exception as e:
        print("SERVER ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
