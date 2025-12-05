from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from datetime import datetime
from collections import OrderedDict
from main import extract_video_id, get_video_info, get_transcript, count_keywords, BIBLE_BOOKS, get_channel_location, validate_channel_is_sermon

app = Flask(__name__)

CACHE_FILE = 'cache.json'
RESULTS_FILE = os.getenv('RESULTS_FILE', 'results.json')
MAX_CACHE = 10

def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_cache(cache):
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f)

def get_cached_video(video_id):
    cache = load_cache()
    return cache.get(video_id)

def cache_video(video_id, video_data):
    cache = load_cache()
    if len(cache) >= MAX_CACHE:
        # Remove oldest (first in OrderedDict, but since dict, remove arbitrary or by time)
        oldest = min(cache.keys(), key=lambda k: cache[k].get('cached_at', 0))
        del cache[oldest]
    cache[video_id] = video_data
    cache[video_id]['cached_at'] = datetime.now().isoformat()
    save_cache(cache)

@app.route('/')
def index():
    results_file = RESULTS_FILE
    if os.path.exists(results_file):
        with open(results_file, 'r') as f:
            all_results = json.load(f)
        videos = list(all_results.values())
    elif os.path.exists(results_file + '.b64'):
        # Try base64 encoded file
        import base64
        with open(results_file + '.b64', 'r') as f:
            encoded_data = f.read()
        decoded_data = base64.b64decode(encoded_data).decode()
        all_results = json.loads(decoded_data)
        videos = list(all_results.values())
    else:
        videos = []
    # Sort by processed_at descending
    videos.sort(key=lambda x: x.get('processed_at', ''), reverse=True)
    
    # Aggregate top referenced books (including both confirmed and suspect references)
    book_totals = {}
    for video in videos:
        counts = video.get('counts', {})
        suspect_counts = video.get('suspect_counts', {})
        for book, count in counts.items():
            book_totals[book] = book_totals.get(book, 0) + count
        for book, count in suspect_counts.items():
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
        return jsonify({'error': 'No URL provided'}), 400
    
    keywords = BIBLE_BOOKS
    logs = []
    
    try:
        logs.append("Starting video analysis...")
        
        # Step 1: Extract video ID
        try:
            video_id = extract_video_id(url)
            logs.append(f"Extracted video ID: {video_id}")
        except Exception as e:
            logs.append(f"Failed to extract video ID: {str(e)}")
            return jsonify({'error': f'Invalid YouTube URL: {str(e)}', 'logs': logs}), 400
        
        # Step 2: Get video info
        try:
            title, channel, channel_url = get_video_info(video_id)
            logs.append(f"Retrieved video info - Title: {title}, Channel: {channel}")
        except Exception as e:
            logs.append(f"Failed to get video info: {str(e)}")
            return jsonify({'error': f'Unable to retrieve video information: {str(e)}', 'logs': logs}), 400
        
        # Step 3: Validate channel
        try:
            is_sermon_channel, description = validate_channel_is_sermon(channel_url)
            if not is_sermon_channel:
                logs.append(f"Channel validation failed: {description}")
                return jsonify({
                    'error': f'Channel validation failed. The channel "{channel}" does not appear to be sermon-related. Channel description does not contain keywords: church, Christ, or Jesus.',
                    'logs': logs
                }), 400
            logs.append("Channel validation passed")
        except Exception as e:
            logs.append(f"Channel validation error: {str(e)}")
            # Allow processing to continue even if validation fails
            logs.append("Continuing despite validation error...")
        
        # Step 4: Get channel location
        try:
            location = get_channel_location(channel_url)
            logs.append(f"Retrieved channel location: {location}")
        except Exception as e:
            logs.append(f"Failed to get channel location: {str(e)}")
            location = ""
        
        # Step 5: Get transcript
        try:
            transcript_text, transcript_snippets, transcript_logs = get_transcript(video_id)
            logs.extend(transcript_logs)
            if transcript_text is None:
                logs.append("Transcript retrieval failed")
                return jsonify({
                    'error': 'Unable to retrieve transcript. This may be due to YouTube restrictions on automated requests. Please try a different video or check back later.',
                    'logs': logs
                }), 400
            logs.append(f"Retrieved transcript: {len(transcript_text)} characters")
        except Exception as e:
            logs.append(f"Transcript retrieval error: {str(e)}")
            return jsonify({
                'error': f'Unable to retrieve transcript: {str(e)}',
                'logs': logs
            }), 400
        
        # Step 6: Analyze keywords
        try:
            counts, suspect_counts, positions, stats = count_keywords(transcript_text, keywords, transcript_snippets)
            logs.append(f"Analysis complete - Found {stats['scripture_references']} confirmed references")
        except Exception as e:
            logs.append(f"Analysis error: {str(e)}")
            return jsonify({'error': f'Error analyzing transcript: {str(e)}', 'logs': logs}), 500
        
        # Step 7: Save results
        try:
            results_file = RESULTS_FILE
            if os.path.exists(results_file + '.b64'):
                # Load from base64 file
                import base64
                with open(results_file + '.b64', 'r') as f:
                    encoded_data = f.read()
                decoded_data = base64.b64decode(encoded_data).decode()
                all_results = json.loads(decoded_data)
            elif os.path.exists(results_file):
                # Fallback to plain JSON if exists
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
                'positions': positions,
                'logs': logs
            }
            
            # Check if this is a reprocessing
            is_reprocessing = video_id in all_results
            
            all_results[video_id] = video_data
            
            # Save as base64
            import base64
            encoded_data = base64.b64encode(json.dumps(all_results, separators=(',', ':')).encode()).decode()
            with open(results_file + '.b64', 'w') as f:
                f.write(encoded_data)
            
            logs.append("Results saved successfully")
        except Exception as e:
            logs.append(f"Failed to save results: {str(e)}")
            return jsonify({'error': f'Error saving results: {str(e)}', 'logs': logs}), 500
        
        redirect_url = url_for('video_detail', video_id=video_id)
        if is_reprocessing:
            redirect_url += '?reprocessed=1'
        
        logs.append("Analysis complete!")
        return jsonify({
            'success': True,
            'redirect_url': redirect_url,
            'logs': logs
        })
    
    except Exception as e:
        # This should catch any unhandled exceptions
        import traceback
        error_details = traceback.format_exc()
        return jsonify({
            'error': f'Unexpected error: {str(e)}', 
            'logs': logs + [f'Error details: {error_details}']
        }), 500

@app.route('/video/<video_id>')
def video_detail(video_id):
    video_data = get_cached_video(video_id)
    if not video_data:
        # Process on demand
        try:
            keywords = BIBLE_BOOKS
            title, channel, channel_url = get_video_info(video_id)
            
            # Validate channel
            is_sermon_channel, description = validate_channel_is_sermon(channel_url)
            if not is_sermon_channel:
                return f'Channel validation failed: {description}', 400
            
            location = get_channel_location(channel_url)
            transcript_text, transcript_snippets, logs = get_transcript(video_id)
            if transcript_text is None:
                return f"Unable to retrieve transcript. Logs: {'; '.join(logs)}", 400
            counts, suspect_counts, positions, stats = count_keywords(transcript_text, keywords, transcript_snippets)
            
            # Prepare data
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
                'positions': positions,
                'logs': logs
            }
            
            cache_video(video_id, video_data)
        except Exception as e:
            return f"Error processing video: {str(e)}", 500
    
    reprocessed = request.args.get('reprocessed') == '1'
    
    try:
        # Process positions into all_refs_by_book
        all_refs_by_book = {}
        last_chapter = {}  # Track last known chapter per book
        if 'positions' in video_data and video_data['positions']:
            for book, pos_dict in video_data['positions'].items():
                if pos_dict:
                    for category in ['valid', 'suspect', 'false_positive']:
                        if category in pos_dict and pos_dict[category]:
                            for ref in pos_dict[category]:
                                if ref:  # Check if ref is not None
                                    ref_with_type = dict(ref)
                                    if category == 'valid':
                                        ref_with_type['type'] = 'confirmed'
                                    elif category == 'suspect':
                                        ref_with_type['type'] = 'suspect'
                                    else:
                                        ref_with_type['type'] = 'false_positive'
                                    
                                    # Extract verse - prefer the matched pattern if it's a verse reference
                                    import re
                                    matched_pattern = ref_with_type.get('matched_pattern', '')
                                    
                                    # If matched_pattern is a verse reference, use it
                                    verse_match = re.search(r'\b(\d+:\d+)\b', matched_pattern)
                                    if verse_match:
                                        ref_with_type['verse'] = verse_match.group(1)
                                    else:
                                        # Check for chapter references like "chapter 5"
                                        chapter_match = re.search(r'chapter\s+(\d+)', matched_pattern, re.IGNORECASE)
                                        if chapter_match:
                                            ref_with_type['verse'] = chapter_match.group(1)
                                        else:
                                            # Check for verse references like "verse 24"
                                            verse_only_match = re.search(r'verse\s+(\d+)', matched_pattern, re.IGNORECASE)
                                            if verse_only_match:
                                                ref_with_type['verse'] = verse_only_match.group(1)
                                            else:
                                                # Otherwise find the first verse in context
                                                verse_match = re.search(r'\b\d+:\d+\b', ref_with_type.get('context', ''))
                                                ref_with_type['verse'] = verse_match.group(0) if verse_match else 'N/A'
                                    
                                    # If verse doesn't contain ':', try to find chapter in context
                                    if ref_with_type.get('verse') and ref_with_type['verse'] != 'N/A' and ':' not in str(ref_with_type['verse']):
                                        if 'chapter' in matched_pattern.lower():
                                            # It's already a chapter reference, don't prepend
                                            pass
                                        else:
                                            context = ref_with_type.get('context', '')
                                            # Look for book chapter:verse in context
                                            chapter_verse_match = re.search(r'\b' + re.escape(book) + r'\s+(\d+):(\d+)\b', context, re.IGNORECASE)
                                            if chapter_verse_match:
                                                ref_with_type['verse'] = f"{chapter_verse_match.group(1)}:{chapter_verse_match.group(2)}"
                                            else:
                                                # Look for chapter reference in context
                                                chapter_match = re.search(r'\b' + re.escape(book) + r'\s+(\d+)\b', context, re.IGNORECASE)
                                                if chapter_match:
                                                    ref_with_type['verse'] = f"{chapter_match.group(1)}:{ref_with_type['verse']}"
                                                elif last_chapter.get(book):
                                                    ref_with_type['verse'] = f"{last_chapter[book]}:{ref_with_type['verse']}"
                                    
                                    # If verse is still 'N/A' but we have last_chapter, use it
                                    if ref_with_type.get('verse') == 'N/A' and last_chapter.get(book):
                                        ref_with_type['verse'] = last_chapter[book]
                                    
                                    # Update last known chapter for this book
                                    if ref_with_type.get('verse') and ref_with_type['verse'] != 'N/A':
                                        if ':' in str(ref_with_type['verse']):
                                            chapter = ref_with_type['verse'].split(':')[0]
                                            last_chapter[book] = chapter
                                        elif 'chapter' in matched_pattern.lower():
                                            last_chapter[book] = ref_with_type['verse']
                                    
                                    # Highlight book name and underline matched pattern in context
                                    
                                    # Highlight book name and underline matched pattern in context
                                    context = ref_with_type.get('context', '')
                                    matched_pattern = ref_with_type.get('matched_pattern', '')
                                    
                                    # First, underline the matched pattern if it exists
                                    if matched_pattern:
                                        # Find all occurrences of the pattern
                                        pattern_matches = list(re.finditer(re.escape(matched_pattern), context, re.IGNORECASE))
                                        if pattern_matches:
                                            # Find the occurrence closest to the book name
                                            book_pos = context.lower().find(book.lower())
                                            if book_pos >= 0:
                                                closest_match = min(pattern_matches, key=lambda m: abs(book_pos - m.start()))
                                                # Replace only that specific occurrence
                                                start_pos = closest_match.start()
                                                end_pos = closest_match.end()
                                                context = (
                                                    context[:start_pos] + 
                                                    '<span class="underline">' + context[start_pos:end_pos] + '</span>' + 
                                                    context[end_pos:]
                                                )
                                    
                                    # Then highlight book name in primary color
                                    highlighted_context = re.sub(
                                        r'\b(' + re.escape(book) + r')\b',
                                        r'<span class="text-primary-400 font-semibold dark:font-medium">\1</span>',
                                        context,
                                        flags=re.IGNORECASE
                                    )
                                    ref_with_type['context_html'] = highlighted_context
                                    
                                    if book not in all_refs_by_book:
                                        all_refs_by_book[book] = []
                                    all_refs_by_book[book].append(ref_with_type)
            
            # Sort each book's refs by start time
            for book, refs in all_refs_by_book.items():
                refs.sort(key=lambda x: x.get('start', 0))
        
        return render_template('video.html', video=video_data, reprocessed=reprocessed, all_refs_by_book=all_refs_by_book)
    except Exception as e:
        return f"Error rendering video page: {str(e)}", 500

@app.route('/rebuild')
def rebuild_database():
    """Secret route to clear the results database."""
    results_file = RESULTS_FILE
    b64_file = results_file + '.b64'
    json_file = results_file
    
    # Remove both files if they exist
    if os.path.exists(b64_file):
        os.remove(b64_file)
    if os.path.exists(json_file):
        os.remove(json_file)
    
    return redirect(url_for('index'))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.config['DEBUG'] = False
    app.config['TESTING'] = False
    os.environ['FLASK_ENV'] = 'production'
    app.run(host='0.0.0.0', port=port, debug=False)