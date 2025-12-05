from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from datetime import datetime
from main import extract_video_id, get_video_info, get_transcript, count_keywords, BIBLE_BOOKS

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
    
    # Aggregate top referenced books
    book_totals = {}
    for video in videos:
        counts = video.get('counts', {})
        for book, count in counts.items():
            book_totals[book] = book_totals.get(book, 0) + count
    
    # Get top 10 referenced books
    top_books = sorted(book_totals.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Aggregate top churches (channels) by total references
    channel_totals = {}
    for video in videos:
        channel = video.get('channel', 'Unknown')
        refs = video.get('stats', {}).get('scripture_references', 0)
        channel_totals[channel] = channel_totals.get(channel, 0) + refs
    
    # Get top 10 churches
    top_churches = sorted(channel_totals.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Get top 10 sermons by scripture references
    top_sermons = sorted(videos, key=lambda x: x.get('stats', {}).get('scripture_references', 0), reverse=True)[:10]
    
    return render_template('index.html', videos=videos, top_books=top_books, top_churches=top_churches, top_sermons=top_sermons)

@app.route('/analyze', methods=['POST'])
def analyze():
    url = request.form.get('url')
    
    if not url:
        return "No URL provided", 400
    
    keywords = BIBLE_BOOKS
    
    try:
        video_id = extract_video_id(url)
        title, channel = get_video_info(url)
        transcript_text, transcript_snippets = get_transcript(video_id)
        counts, suspect_counts, positions, stats = count_keywords(transcript_text, keywords, transcript_snippets)
        
        # Save results to JSON
        results_file = 'results.json'
        if os.path.exists(results_file):
            with open(results_file, 'r') as f:
                all_results = json.load(f)
        else:
            all_results = {}
        
        # Prepare counts for all 66 books
        full_counts = {book: counts.get(book, 0) for book in BIBLE_BOOKS}
        full_suspect_counts = {book: suspect_counts.get(book, 0) for book in BIBLE_BOOKS}
        
        video_data = {
            'video_id': video_id,
            'title': title,
            'channel': channel,
            'transcript_length': len(transcript_text),
            'processed_at': str(datetime.now()),
            'stats': stats,
            'counts': full_counts,
            'suspect_counts': full_suspect_counts
        }
        
        all_results[video_id] = video_data
        
        with open(results_file, 'w') as f:
            json.dump(all_results, f, indent=2)
        
        return redirect(url_for('video_detail', video_id=video_id))
    
    except Exception as e:
        return f"Error analyzing video: {str(e)}", 500

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