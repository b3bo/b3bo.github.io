#!/usr/bin/env python3
"""
Migrate videos from file-based storage to database
"""

import os
import sys
import base64
import json
import html
from datetime import datetime

# Add the current directory to the path so we can import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Video

def migrate_videos_to_database():
    """Migrate videos from file-based storage to database."""
    try:
        # Read old file-based data
        if not os.path.exists('results.json.b64'):
            print("No old results file found")
            return

        with open('results.json.b64', 'r') as f:
            encoded = f.read()
        decoded = base64.b64decode(encoded).decode()
        old_data = json.loads(decoded)

        print(f"Found {len(old_data)} videos to migrate")

        with app.app_context():
            migrated_count = 0
            skipped_count = 0

            for video_id, video_data in old_data.items():
                # Check if video already exists in database
                existing_video = Video.query.filter_by(video_id=video_id).first()
                if existing_video:
                    print(f"Video {video_id} already exists in database, skipping")
                    skipped_count += 1
                    continue

                # Decode HTML entities in title
                title = html.unescape(video_data.get('title', 'Unknown Title'))

                # Create new video record
                new_video = Video(
                    video_id=video_id,
                    title=title,
                    channel=video_data.get('channel', 'Unknown Channel'),
                    channel_url=video_data.get('channel_url', ''),
                    location=video_data.get('location', ''),
                    transcript_length=video_data.get('transcript_length', 0),
                    processed_at=datetime.fromisoformat(video_data['processed_at']) if 'processed_at' in video_data else datetime.now(),
                    stats_scripture_references=video_data['stats']['scripture_references'],
                    stats_suspect_references=video_data['stats']['suspect_references'],
                    stats_false_positives=video_data['stats']['false_positives'],
                    stats_total_matches=video_data['stats']['total_matches'],
                    counts_data=json.dumps(video_data['counts']),
                    suspect_counts_data=json.dumps(video_data['suspect_counts']),
                    positions_data=json.dumps(video_data['positions']),
                    logs_data=json.dumps(video_data.get('logs', []))
                )

                db.session.add(new_video)
                migrated_count += 1

                print(f"Migrated: '{title}' (was: '{video_data.get('title', 'Unknown')}')")

            # Commit all changes
            db.session.commit()
            print(f"\nMigration complete: {migrated_count} videos migrated, {skipped_count} skipped")

            # Verify the migration
            total_in_db = Video.query.count()
            print(f"Total videos in database: {total_in_db}")

    except Exception as e:
        print(f"Error during migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    migrate_videos_to_database()