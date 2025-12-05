from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def index():
    results_file = 'results.json'
    videos = []
    if os.path.exists(results_file):
        with open(results_file, 'r') as f:
            data = json.load(f)
            videos = list(data.values())
            # Sort by processed_at descending
            videos.sort(key=lambda x: x.get('processed_at', ''), reverse=True)
    
    return render_template('index.html', videos=videos)

@app.route('/video/<video_id>')
def video_detail(video_id):
    results_file = 'results.json'
    video_data = None
    if os.path.exists(results_file):
        with open(results_file, 'r') as f:
            data = json.load(f)
            video_data = data.get(video_id)
    
    if not video_data:
        return "Video not found", 404
    
    return render_template('video.html', video=video_data)

@app.route('/api/videos')
def api_videos():
    results_file = 'results.json'
    if os.path.exists(results_file):
        with open(results_file, 'r') as f:
            return jsonify(json.load(f))
    return jsonify({})

if __name__ == '__main__':
    app.run(debug=True)