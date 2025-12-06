#!/usr/bin/env python3
"""
Initialize database from JSON backup on startup
This ensures data is loaded into Render's PostgreSQL on deployment
"""

import os
import sys
import json
import base64
from datetime import datetime

def init_database_from_json():
    """Load data from results.json.b64 into database if database is empty"""
    from app import app, Video, db

    json_file = 'results.json.b64'

    if not os.path.exists(json_file):
        print(f"No {json_file} found - skipping database initialization")
        return

    with app.app_context():
        # Check if database already has data
        existing_count = Video.query.count()

        if existing_count > 0:
            print(f"Database already has {existing_count} videos - skipping initialization")
            return

        print(f"Database is empty - loading from {json_file}...")

        try:
            # Load JSON data
            with open(json_file, 'r', encoding='utf-8') as f:
                encoded_data = f.read()

            decoded_data = base64.b64decode(encoded_data).decode('utf-8')
            data = json.loads(decoded_data)

            print(f"Found {len(data)} videos in JSON backup")

            # Load into database
            for video_id, video_data in data.items():
                video = Video(
                    video_id=video_id,
                    title=video_data['title'],
                    channel=video_data['channel'],
                    channel_url=video_data.get('channel_url'),
                    location=video_data.get('location'),
                    transcript_length=video_data.get('transcript_length', 0),
                    processed_at=datetime.fromisoformat(video_data['processed_at']) if isinstance(video_data.get('processed_at'), str) else datetime.utcnow(),
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
                print(f"  Loaded: {video_id} - {video_data['title'][:50]}")

            db.session.commit()

            # Verify
            final_count = Video.query.count()
            print(f"✅ Database initialized with {final_count} videos")

        except Exception as e:
            print(f"❌ Error initializing database: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    print("="*60)
    print("DATABASE INITIALIZATION")
    print("="*60)
    init_database_from_json()
