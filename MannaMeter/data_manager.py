#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MannaMeter Data Manager
Handles safe data storage with automatic backups and verification
"""

import os
import sys
import json
import base64
import shutil
from datetime import datetime
from pathlib import Path

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass


def safe_save_to_json(video_data, results_file='results.json'):
    """
    Save video data to JSON file with safety backups and verification

    Safety features:
    - Creates backup before any changes
    - Error handling with automatic backup restoration
    - Writes to temporary file first
    - Verifies write succeeded before committing
    - Atomic file replacement (where supported)

    Args:
        video_data: Dictionary containing video analysis data
        results_file: Path to results file (without .b64 extension)

    Returns:
        bool: True if save succeeded, False otherwise
    """
    results_path = results_file + '.b64'

    try:
        # 1. Create backup of current file BEFORE any changes
        if os.path.exists(results_path):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = f"backups/pre_write_{timestamp}.json.b64"
            os.makedirs('backups', exist_ok=True)
            shutil.copy2(results_path, backup_file)
            print(f"🔒 Safety backup created: {backup_file}")

        # 2. Load existing data with error handling
        all_results = {}
        try:
            if os.path.exists(results_path):
                with open(results_path, 'r', encoding='utf-8') as f:
                    encoded_data = f.read()
                decoded_data = base64.b64decode(encoded_data).decode('utf-8')
                all_results = json.loads(decoded_data)
                print(f"📖 Loaded {len(all_results)} existing videos")
        except Exception as e:
            print(f"⚠️  ERROR loading existing data: {e}")
            print(f"🚨 Attempting to restore from latest backup...")
            # Try to restore from latest backup
            backup_dir = Path('backups')
            if backup_dir.exists():
                backups = sorted(backup_dir.glob('*.json.b64'),
                                key=lambda x: x.stat().st_mtime,
                                reverse=True)
                if backups:
                    try:
                        with open(backups[0], 'r', encoding='utf-8') as f:
                            encoded = f.read()
                        all_results = json.loads(base64.b64decode(encoded).decode('utf-8'))
                        print(f"✅ Restored from backup: {backups[0].name}")
                    except Exception as restore_error:
                        print(f"❌ Backup restore failed: {restore_error}")
                        print(f"⚠️  Starting with empty data - VIDEO WILL BE SAVED!")
                        all_results = {}

        # 3. Add new video (merge, don't replace)
        all_results[video_data['video_id']] = video_data
        print(f"➕ Adding video: {video_data['video_id']} - {video_data['title'][:50]}...")

        # 4. Write to temporary file first
        temp_file = results_path + '.tmp'
        encoded_data = base64.b64encode(
            json.dumps(all_results, separators=(',', ':')).encode('utf-8')
        ).decode('utf-8')

        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(encoded_data)

        # 5. Verify write succeeded by reading temp file
        try:
            with open(temp_file, 'r', encoding='utf-8') as f:
                verify_encoded = f.read()
            verify_data = json.loads(base64.b64decode(verify_encoded).decode('utf-8'))

            if video_data['video_id'] not in verify_data:
                raise Exception("Write verification failed - video not in temp file!")

            if len(verify_data) != len(all_results):
                raise Exception(f"Write verification failed - count mismatch: {len(verify_data)} vs {len(all_results)}")

            print(f"✓ Write verification passed: {len(verify_data)} videos")

        except Exception as verify_error:
            print(f"❌ Verification failed: {verify_error}")
            # Clean up temp file
            if os.path.exists(temp_file):
                os.remove(temp_file)
            return False

        # 6. Atomic rename/replace
        try:
            # Windows and POSIX compatible replace
            if os.path.exists(results_path):
                # Create final safety backup
                final_backup = results_path + '.before_replace'
                shutil.copy2(results_path, final_backup)

            # Replace old file with new
            shutil.move(temp_file, results_path)

            # Clean up safety backup
            if os.path.exists(results_path + '.before_replace'):
                os.remove(results_path + '.before_replace')

            print(f"✅ Video saved successfully: {video_data['video_id']}")
            print(f"📊 Total videos in database: {len(all_results)}")
            return True

        except Exception as move_error:
            print(f"❌ File replacement failed: {move_error}")
            # Try to restore from before_replace backup
            if os.path.exists(results_path + '.before_replace'):
                shutil.copy2(results_path + '.before_replace', results_path)
                print(f"✅ Restored from safety backup")
            return False

    except Exception as e:
        print(f"❌ CRITICAL ERROR in safe_save_to_json: {e}")
        print(f"🚨 Attempting emergency save...")
        return emergency_save_to_json(video_data, results_file)


def emergency_save_to_json(video_data, results_file='results.json'):
    """
    Emergency fallback save - creates standalone backup file

    If the normal save process fails completely, this creates a separate
    emergency backup file with just the current video data.

    Args:
        video_data: Dictionary containing video analysis data
        results_file: Path to results file (for naming emergency backup)

    Returns:
        bool: True if emergency save succeeded
    """
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        emergency_file = f"backups/EMERGENCY_SAVE_{timestamp}_{video_data['video_id']}.json.b64"
        os.makedirs('backups', exist_ok=True)

        # Save just this video
        emergency_data = {video_data['video_id']: video_data}
        encoded = base64.b64encode(
            json.dumps(emergency_data, separators=(',', ':')).encode('utf-8')
        ).decode('utf-8')

        with open(emergency_file, 'w', encoding='utf-8') as f:
            f.write(encoded)

        print(f"🚨 EMERGENCY SAVE SUCCESSFUL: {emergency_file}")
        print(f"⚠️  VIDEO DATA PRESERVED - merge this file manually later!")
        return True

    except Exception as e:
        print(f"💀 EMERGENCY SAVE FAILED: {e}")
        print(f"💀 VIDEO DATA MAY BE LOST!")
        # Try absolute last resort - write plain JSON to current directory
        try:
            with open(f'LOST_VIDEO_{video_data["video_id"]}.json', 'w') as f:
                json.dump(video_data, f, indent=2)
            print(f"💾 Last resort: saved to LOST_VIDEO_{video_data['video_id']}.json")
            return False
        except:
            return False


def save_to_database(video_data):
    """
    Save video data to PostgreSQL/SQLite database

    Uses database transactions for ACID guarantees.
    Falls back to JSON save if database fails.

    Args:
        video_data: Dictionary containing video analysis data

    Returns:
        bool: True if save succeeded
    """
    try:
        # Import here to avoid circular imports
        from app import app, Video, db
        import json

        with app.app_context():
            # Start transaction
            try:
                # Check if video exists
                video = Video.query.filter_by(video_id=video_data['video_id']).first()

                if video:
                    # Update existing
                    print(f"📝 Updating existing video: {video_data['video_id']}")
                    video.title = video_data['title']
                    video.channel = video_data['channel']
                    video.channel_url = video_data.get('channel_url')
                    video.location = video_data.get('location')
                    video.transcript_length = video_data.get('transcript_length', 0)
                    video.processed_at = datetime.fromisoformat(video_data['processed_at']) if isinstance(video_data.get('processed_at'), str) else datetime.now()
                    video.stats_scripture_references = video_data['stats']['scripture_references']
                    video.stats_suspect_references = video_data['stats']['suspect_references']
                    video.stats_false_positives = video_data['stats']['false_positives']
                    video.stats_total_matches = video_data['stats']['total_matches']
                    video.counts_data = json.dumps(video_data['counts'])
                    video.suspect_counts_data = json.dumps(video_data['suspect_counts'])
                    video.positions_data = json.dumps(video_data.get('positions', {}))
                    video.logs_data = json.dumps(video_data.get('logs', []))
                else:
                    # Create new
                    print(f"➕ Creating new video: {video_data['video_id']}")
                    video = Video(
                        video_id=video_data['video_id'],
                        title=video_data['title'],
                        channel=video_data['channel'],
                        channel_url=video_data.get('channel_url'),
                        location=video_data.get('location'),
                        transcript_length=video_data.get('transcript_length', 0),
                        processed_at=datetime.fromisoformat(video_data['processed_at']) if isinstance(video_data.get('processed_at'), str) else datetime.now(),
                        stats_scripture_references=video_data['stats']['scripture_references'],
                        stats_suspect_references=video_data['stats']['suspect_references'],
                        stats_false_positives=video_data['stats']['false_positives'],
                        stats_total_matches=video_data['stats']['total_matches'],
                        counts_data=json.dumps(video_data['counts']),
                        suspect_counts_data=json.dumps(video_data['suspect_counts']),
                        positions_data=json.dumps(video_data.get('positions', {})),
                        logs_data=json.dumps(video_data.get('logs', []))
                    )
                    db.session.add(video)

                # Commit transaction
                db.session.commit()

                # VERIFY write succeeded
                verify = Video.query.filter_by(video_id=video_data['video_id']).first()
                if not verify:
                    raise Exception("Write verification failed - video not in database after commit")

                print(f"✅ Video saved to database: {video_data['video_id']}")

                # Now export database to JSON as backup
                export_database_to_json()

                return True

            except Exception as e:
                db.session.rollback()
                print(f"❌ ERROR saving to database: {e}")
                raise

    except Exception as e:
        print(f"💥 DATABASE SAVE FAILED: {e}")
        print(f"🚨 Falling back to JSON file save...")

        # EMERGENCY: Save to JSON file directly as fallback
        return safe_save_to_json(video_data)


def export_database_to_json():
    """
    Export entire database to results.json.b64 and results.json

    Creates both base64-encoded and plain JSON files for:
    - Base64: Consistent with backup format
    - Plain JSON: For GitHub Pages static site
    """
    try:
        from app import app, Video
        import json
        import base64

        with app.app_context():
            videos = Video.query.all()
            all_results = {v.video_id: v.to_dict() for v in videos}

            # Write to results.json.b64 (base64 encoded)
            encoded_data = base64.b64encode(
                json.dumps(all_results, separators=(',', ':')).encode('utf-8')
            ).decode('utf-8')

            with open('results.json.b64', 'w', encoding='utf-8') as f:
                f.write(encoded_data)

            # ALSO write plain JSON for GitHub Pages
            with open('results.json', 'w', encoding='utf-8') as f:
                json.dump(all_results, f, separators=(',', ':'))

            print(f"✅ Exported {len(all_results)} videos to JSON files")
            return True

    except Exception as e:
        print(f"⚠️  Export to JSON failed: {e}")
        return False


def load_all_videos():
    """
    Load all videos from both database and JSON file

    Returns the union of both sources, with database taking precedence.

    Returns:
        dict: All videos keyed by video_id
    """
    all_videos = {}

    # Try database first
    try:
        from app import app, Video

        with app.app_context():
            videos = Video.query.all()
            for v in videos:
                all_videos[v.video_id] = v.to_dict()

        if all_videos:
            print(f"📊 Loaded {len(all_videos)} videos from database")
    except Exception as e:
        print(f"⚠️  Could not load from database: {e}")

    # Also check JSON file
    try:
        if os.path.exists('results.json.b64'):
            with open('results.json.b64', 'r', encoding='utf-8') as f:
                encoded = f.read()
            json_data = json.loads(base64.b64decode(encoded).decode('utf-8'))

            # Merge with database data (database wins on conflicts)
            for video_id, video_data in json_data.items():
                if video_id not in all_videos:
                    all_videos[video_id] = video_data

            print(f"📊 Total videos (DB + JSON): {len(all_videos)}")
    except Exception as e:
        print(f"⚠️  Could not load from JSON: {e}")

    return all_videos
