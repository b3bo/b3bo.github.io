from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from datetime import datetime
from collections import OrderedDict
from main import extract_video_id, get_video_info, get_transcript, count_keywords, BIBLE_BOOKS, get_channel_location, validate_channel_is_sermon
from flask_sqlalchemy import SQLAlchemy
import base64

app = Flask(__name__)

# Version information
VERSION = "1.0.5"

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
else:
    # Fallback to SQLite for local development
    db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, 'mannameter.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Create database tables
with app.app_context():
    db.create_all()

# Database Models
class Video(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    video_id = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.Text, nullable=False)
    channel = db.Column(db.Text, nullable=False)
    channel_url = db.Column(db.Text)
    location = db.Column(db.Text)
    transcript_length = db.Column(db.Integer)
    processed_at = db.Column(db.DateTime, default=datetime.utcnow)
    stats_scripture_references = db.Column(db.Integer, default=0)
    stats_suspect_references = db.Column(db.Integer, default=0)
    stats_false_positives = db.Column(db.Integer, default=0)
    stats_total_matches = db.Column(db.Integer, default=0)
    counts_data = db.Column(db.Text)  # JSON string
    suspect_counts_data = db.Column(db.Text)  # JSON string
    positions_data = db.Column(db.Text)  # JSON string
    logs_data = db.Column(db.Text)  # JSON string

    def to_dict(self):
        return {
            'video_id': self.video_id,
            'title': self.title,
            'channel': self.channel,
            'channel_url': self.channel_url,
            'location': self.location,
            'transcript_length': self.transcript_length,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'stats': {
                'scripture_references': self.stats_scripture_references,
                'suspect_references': self.stats_suspect_references,
                'false_positives': self.stats_false_positives,
                'total_matches': self.stats_total_matches
            },
            'counts': json.loads(self.counts_data) if self.counts_data else {},
            'suspect_counts': json.loads(self.suspect_counts_data) if self.suspect_counts_data else {},
            'positions': json.loads(self.positions_data) if self.positions_data else {},
            'logs': json.loads(self.logs_data) if self.logs_data else []
        }

# Configuration
RESULTS_FILE = os.getenv('RESULTS_FILE', 'results.json')
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

CACHE_FILE = 'cache.json'
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
    # First check database
    video = Video.query.filter_by(video_id=video_id).first()
    if video:
        return video.to_dict()
    
    # Fallback to file cache for any legacy data
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
    # Load all videos from database
    videos_db = Video.query.order_by(Video.processed_at.desc()).all()
    videos = [video.to_dict() for video in videos_db]
    
    # Calculate total stats
    total_refs = sum(video.get('stats', {}).get('scripture_references', 0) for video in videos)
    total_suspect = sum(video.get('stats', {}).get('suspect_references', 0) for video in videos)
    total_fp = sum(video.get('stats', {}).get('false_positives', 0) for video in videos)
    total_matches = sum(video.get('stats', {}).get('total_matches', 0) for video in videos)
    
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
    
    return render_template('index.html', 
                          videos=videos, 
                          top_books=top_books, 
                          top_churches=top_churches, 
                          top_sermons=top_sermons, 
                          total_refs=total_refs,
                          total_suspect=total_suspect,
                          total_fp=total_fp,
                          total_matches=total_matches,
                          version=VERSION)

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
            # Prepare counts for all 66 books
            full_counts = {book: counts.get(book, 0) for book in BIBLE_BOOKS}
            full_suspect_counts = {book: suspect_counts.get(book, 0) for book in BIBLE_BOOKS}
            
            # Check if video already exists
            existing_video = Video.query.filter_by(video_id=video_id).first()
            is_reprocessing = existing_video is not None
            
            if existing_video:
                # Update existing video
                existing_video.title = title
                existing_video.channel = channel
                existing_video.channel_url = channel_url
                existing_video.location = location
                existing_video.transcript_length = len(transcript_text)
                existing_video.processed_at = datetime.now()
                existing_video.stats_scripture_references = stats['scripture_references']
                existing_video.stats_suspect_references = stats['suspect_references']
                existing_video.stats_false_positives = stats['false_positives']
                existing_video.stats_total_matches = stats['total_matches']
                existing_video.counts_data = json.dumps(full_counts)
                existing_video.suspect_counts_data = json.dumps(full_suspect_counts)
                existing_video.positions_data = json.dumps(positions)
                existing_video.logs_data = json.dumps(logs)
            else:
                # Create new video
                new_video = Video(
                    video_id=video_id,
                    title=title,
                    channel=channel,
                    channel_url=channel_url,
                    location=location,
                    transcript_length=len(transcript_text),
                    processed_at=datetime.now(),
                    stats_scripture_references=stats['scripture_references'],
                    stats_suspect_references=stats['suspect_references'],
                    stats_false_positives=stats['false_positives'],
                    stats_total_matches=stats['total_matches'],
                    counts_data=json.dumps(full_counts),
                    suspect_counts_data=json.dumps(full_suspect_counts),
                    positions_data=json.dumps(positions),
                    logs_data=json.dumps(logs)
                )
                db.session.add(new_video)
            
            db.session.commit()
            logs.append("Results saved successfully")
        except Exception as e:
            db.session.rollback()
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
        # Video not found - redirect to analyze it
        return redirect(url_for('analyze', url=f'https://www.youtube.com/watch?v={video_id}'))
    
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
                                                ref_with_type['verse'] = '1'  # Default
                                    
                                    # Set context_html to context
                                    ref_with_type['context_html'] = ref_with_type.get('context', '')
                                    
                                    if book not in all_refs_by_book:
                                        all_refs_by_book[book] = []
                                    all_refs_by_book[book].append(ref_with_type)
                                    
                                    if book not in all_refs_by_book:
                                        all_refs_by_book[book] = []
                                    all_refs_by_book[book].append(ref_with_type)
            
            # Sort each book's refs by start time
            for book, refs in all_refs_by_book.items():
                refs.sort(key=lambda x: x.get('start', 0))
        
        return render_template('video.html', video=video_data, reprocessed=reprocessed, all_refs_by_book=all_refs_by_book, version=VERSION)
    except Exception as e:
        return f"Error rendering video page: {str(e)}", 500

@app.route('/rebuild')
def rebuild_database():
    """Secret route to clear the results database."""
    try:
        # Clear all videos from database
        Video.query.delete()
        db.session.commit()
        return "Database cleared successfully"
    except Exception as e:
        db.session.rollback()
        return f"Error clearing database: {str(e)}"

# Backup routes

@app.route('/backup')
def backup_page():
    """Show backup management page."""
    # Get backup list and stats via API calls
    try:
        backup_dir = os.path.join(SCRIPT_DIR, 'backups')
        if not os.path.exists(backup_dir):
            backups = []
            stats = {'total_backups': 0, 'total_size': 0, 'oldest': None, 'newest': None}
        else:
            # Get all database backup files
            backup_files = []
            for filename in os.listdir(backup_dir):
                if filename.startswith('database_backup_') and filename.endswith('.json.b64'):
                    filepath = os.path.join(backup_dir, filename)
                    mtime = os.path.getmtime(filepath)
                    size = os.path.getsize(filepath)
                    backup_files.append({
                        'name': filename,
                        'path': filepath,
                        'size': size,
                        'created': datetime.fromtimestamp(mtime).isoformat(),
                        'created_human': datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
                    })
            
            # Sort by creation time, newest first
            backup_files.sort(key=lambda x: x['created'], reverse=True)
            backups = backup_files
            
            if not backup_files:
                stats = {'total_backups': 0, 'total_size': 0, 'oldest': None, 'newest': None}
            else:
                total_size = sum(b['size'] for b in backup_files)
                oldest = min(backup_files, key=lambda x: x['created'])
                newest = max(backup_files, key=lambda x: x['created'])
                
                stats = {
                    'total_backups': len(backup_files),
                    'total_size': total_size,
                    'total_size_mb': round(total_size/1024/1024, 2),
                    'oldest': oldest,
                    'newest': newest
                }
    except Exception as e:
        backups = []
        stats = {'total_backups': 0, 'total_size': 0, 'oldest': None, 'newest': None}
    
    return render_template('backup.html', backups=backups, version=VERSION)

@app.route('/api/backup/create', methods=['POST'])
def create_backup():
    """Create a new backup of the database."""
    try:
        # Get all videos from database
        videos = Video.query.all()
        backup_data = {}
        
        for video in videos:
            backup_data[video.video_id] = video.to_dict()
        
        # Create backup filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"database_backup_{timestamp}.json"
        backup_path = os.path.join(SCRIPT_DIR, 'backups', backup_name)
        
        # Ensure backups directory exists
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        
        # Save backup as base64 encoded JSON
        import base64
        encoded_data = base64.b64encode(json.dumps(backup_data, separators=(',', ':')).encode()).decode()
        with open(backup_path + '.b64', 'w') as f:
            f.write(encoded_data)
        
        return jsonify({'success': True, 'message': f'Backup created: {backup_name}.b64'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/backup/list')
def list_backups_api():
    """Get list of database backups via API."""
    try:
        backup_dir = os.path.join(SCRIPT_DIR, 'backups')
        if not os.path.exists(backup_dir):
            return jsonify({'success': True, 'backups': []})
        
        backups = []
        for filename in os.listdir(backup_dir):
            if filename.startswith('database_backup_') and filename.endswith('.json.b64'):
                filepath = os.path.join(backup_dir, filename)
                mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
                backups.append({
                    'name': filename,
                    'path': filepath,
                    'size': os.path.getsize(filepath),
                    'created': mtime.isoformat(),
                    'created_human': mtime.strftime('%Y-%m-%d %H:%M:%S')
                })
        
        # Sort by creation time, newest first
        backups.sort(key=lambda x: x['created'], reverse=True)
        
        return jsonify({'success': True, 'backups': backups})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/backup/restore/<backup_name>', methods=['POST'])
def restore_backup(backup_name):
    """Restore from a specific database backup."""
    try:
        backup_path = os.path.join(SCRIPT_DIR, 'backups', backup_name)
        if not os.path.exists(backup_path):
            return jsonify({'success': False, 'message': f'Backup file not found: {backup_name}'})
        
        # Load backup data
        import base64
        with open(backup_path, 'r') as f:
            encoded_data = f.read()
        decoded_data = base64.b64decode(encoded_data).decode()
        backup_data = json.loads(decoded_data)
        
        # Clear existing data
        Video.query.delete()
        
        # Restore videos from backup
        for video_id, video_data in backup_data.items():
            new_video = Video(
                video_id=video_id,
                title=video_data['title'],
                channel=video_data['channel'],
                channel_url=video_data.get('channel_url'),
                location=video_data.get('location'),
                transcript_length=video_data.get('transcript_length', 0),
                processed_at=datetime.fromisoformat(video_data['processed_at']) if video_data.get('processed_at') else datetime.now(),
                stats_scripture_references=video_data['stats']['scripture_references'],
                stats_suspect_references=video_data['stats']['suspect_references'],
                stats_false_positives=video_data['stats']['false_positives'],
                stats_total_matches=video_data['stats']['total_matches'],
                counts_data=json.dumps(video_data['counts']),
                suspect_counts_data=json.dumps(video_data['suspect_counts']),
                positions_data=json.dumps(video_data['positions']),
                logs_data=json.dumps(video_data['logs'])
            )
            db.session.add(new_video)
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'Restored from backup: {backup_name}'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/backup/cleanup', methods=['POST'])
def cleanup_backups():
    """Clean up old database backups."""
    try:
        backup_dir = os.path.join(SCRIPT_DIR, 'backups')
        if not os.path.exists(backup_dir):
            return jsonify({'success': True, 'message': 'No backup directory found'})
        
        # Get all database backup files
        backup_files = []
        for filename in os.listdir(backup_dir):
            if filename.startswith('database_backup_') and filename.endswith('.json.b64'):
                filepath = os.path.join(backup_dir, filename)
                mtime = os.path.getmtime(filepath)
                backup_files.append((filepath, mtime))
        
        # Sort by modification time, oldest first
        backup_files.sort(key=lambda x: x[1])
        
        # Keep the 5 most recent backups, delete the rest
        if len(backup_files) > 5:
            deleted_count = 0
            for filepath, _ in backup_files[:-5]:
                os.remove(filepath)
                deleted_count += 1
            
            return jsonify({'success': True, 'message': f'Cleaned up {deleted_count} old backups'})
        else:
            return jsonify({'success': True, 'message': 'No old backups to clean up'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/backup/stats')
def backup_stats():
    """Get database backup statistics."""
    try:
        backup_dir = os.path.join(SCRIPT_DIR, 'backups')
        if not os.path.exists(backup_dir):
            stats = {'total_backups': 0, 'total_size': 0, 'oldest': None, 'newest': None}
        else:
            # Get all database backup files
            backup_files = []
            for filename in os.listdir(backup_dir):
                if filename.startswith('database_backup_') and filename.endswith('.json.b64'):
                    filepath = os.path.join(backup_dir, filename)
                    mtime = os.path.getmtime(filepath)
                    size = os.path.getsize(filepath)
                    backup_files.append((filename, filepath, mtime, size))
            
            if not backup_files:
                stats = {'total_backups': 0, 'total_size': 0, 'oldest': None, 'newest': None}
            else:
                total_size = sum(size for _, _, _, size in backup_files)
                oldest = min(backup_files, key=lambda x: x[2])
                newest = max(backup_files, key=lambda x: x[2])
                
                stats = {
                    'total_backups': len(backup_files),
                    'total_size': total_size,
                    'total_size_mb': round(total_size/1024/1024, 2),
                    'oldest': {
                        'name': oldest[0],
                        'date': datetime.fromtimestamp(oldest[2]).isoformat()
                    },
                    'newest': {
                        'name': newest[0],
                        'date': datetime.fromtimestamp(newest[2]).isoformat()
                    }
                }
        return jsonify({'success': True, 'stats': stats})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.config['DEBUG'] = False
    app.config['TESTING'] = False
    os.environ['FLASK_ENV'] = 'production'
    app.run(host='0.0.0.0', port=port, debug=False)