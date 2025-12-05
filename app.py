from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from datetime import datetime
from main import extract_video_id, get_video_info, get_transcript, count_keywords, BIBLE_BOOKS, get_channel_location

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
        location = video.get('location', '')
        channel_url = video.get('channel_url', '')
        if channel not in channel_totals:
            channel_totals[channel] = {'refs': 0, 'location': location, 'url': channel_url}
        channel_totals[channel]['refs'] += refs
    
    # Get top 10 churches
    top_churches = [{'name': k, 'refs': v['refs'], 'location': v['location'], 'url': v['url']} for k,v in sorted(channel_totals.items(), key=lambda x: x[1]['refs'], reverse=True)[:10]]
    
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
        title, channel, channel_url = get_video_info(video_id)
        location = get_channel_location(channel_url)
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
            'channel_url': channel_url,
            'location': location,
            'transcript_length': len(transcript_text),
            'processed_at': str(datetime.now()),
            'stats': stats,
            'counts': full_counts,
            'suspect_counts': full_suspect_counts,
            'positions': positions
        }
        
        # Check if this is a reprocessing
        is_reprocessing = video_id in all_results
        
        all_results[video_id] = video_data
        
        with open(results_file, 'w') as f:
            json.dump(all_results, f, indent=2)
        
        redirect_url = url_for('video_detail', video_id=video_id)
        if is_reprocessing:
            redirect_url += '?reprocessed=1'
        
        return redirect(redirect_url)
    
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
    
    reprocessed = request.args.get('reprocessed') == '1'
    
    # Process positions into all_refs_by_book
    all_refs_by_book = {}
    if 'positions' in video_data and video_data['positions']:
        for book, pos_dict in video_data['positions'].items():
            if pos_dict:
                for category in ['valid', 'suspect']:
                    if category in pos_dict and pos_dict[category]:
                        for ref in pos_dict[category]:
                            if ref:  # Check if ref is not None
                                ref_with_type = dict(ref)
                                ref_with_type['type'] = 'confirmed' if category == 'valid' else 'suspect'
                                
                                # Extract verse if present in context
                                import re
                                verse_match = re.search(r'\b\d+:\d+\b', ref_with_type.get('context', ''))
                                ref_with_type['verse'] = verse_match.group(0) if verse_match else 'N/A'
                                
                                if book not in all_refs_by_book:
                                    all_refs_by_book[book] = []
                                all_refs_by_book[book].append(ref_with_type)
        
        # Sort each book's refs by start time
        for book, refs in all_refs_by_book.items():
            refs.sort(key=lambda x: x.get('start', 0))
    
    return render_template('video.html', video=video_data, reprocessed=reprocessed, all_refs_by_book=all_refs_by_book)
    confirmed_refs = []
    suspect_refs = []
    if 'positions' in video_data:
        for book_data in video_data['positions'].values():
            confirmed_refs.extend(book_data.get('valid', []))
            suspect_refs.extend(book_data.get('suspect', []))
    
    # Create a dictionary of all references by book with type information
    all_refs_by_book = {}
    if 'positions' in video_data:
        for book, book_data in video_data['positions'].items():
            refs_with_type = []
            for ref in book_data.get('valid', []):
                if ref is not None:
                    ref_copy = ref.copy()
                    ref_copy['type'] = 'confirmed'
                    refs_with_type.append(ref_copy)
            for ref in book_data.get('suspect', []):
                if ref is not None:
                    ref_copy = ref.copy()
                    ref_copy['type'] = 'suspect'
                    refs_with_type.append(ref_copy)
            if refs_with_type:
                all_refs_by_book[book] = refs_with_type
    
    return render_template('video.html', video=video_data, reprocessed=reprocessed, confirmed_refs=confirmed_refs, suspect_refs=suspect_refs, all_refs_by_book=all_refs_by_book)

@app.route('/api/videos')
def api_videos():
    results_file = 'results.json'
    if os.path.exists(results_file):
        with open(results_file, 'r') as f:
            return jsonify(json.load(f))
    return jsonify({})

if __name__ == '__main__':
    app.run(debug=True)