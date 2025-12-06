from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)
DB_FILE = "astroRecs.json"

# Ensure the file exists
if not os.path.exists(DB_FILE):
    with open(DB_FILE, "w") as f:
        f.write("[]")

@app.route("/addRec", methods=["POST"])
def add_rec():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    with open(DB_FILE, "r") as f:
        recs = json.load(f)

    recs.append({"text": data["text"]})

    with open(DB_FILE, "w") as f:
        json.dump(recs, f, indent=4)

    return jsonify({"status": "success"})


@app.route("/viewRecs", methods=["GET"])
def view_recs():
    with open(DB_FILE, "r") as f:
        recs = json.load(f)

    return jsonify(recs)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
