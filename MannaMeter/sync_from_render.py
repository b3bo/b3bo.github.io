#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sync database from Render to local

Downloads all videos from Render's live database and updates local files:
- results.json.b64 (base64 encoded)
- results.json (plain JSON for GitHub Pages)
- Local SQLite database

Usage:
    python sync_from_render.py
"""

import sys
import json
import base64
import requests
from datetime import datetime

# Fix Windows console encoding
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

RENDER_URL = "https://mannameter.onrender.com/api/export/database"

def sync_from_render():
    """Download database from Render and update local files"""

    print("="*70)
    print("SYNC FROM RENDER")
    print("="*70)
    print(f"\nFetching database from {RENDER_URL}...")

    try:
        # Fetch data from Render
        response = requests.get(RENDER_URL, timeout=30)
        response.raise_for_status()
        data = response.json()

        if not data.get('success'):
            print(f"❌ Error from API: {data.get('error', 'Unknown error')}")
            return False

        videos = data.get('videos', {})
        count = data.get('count', len(videos))

        print(f"✅ Fetched {count} videos from Render")

        # Display videos
        for i, (video_id, video_data) in enumerate(videos.items(), 1):
            title = video_data['title'][:60]
            refs = video_data['stats']['scripture_references']
            print(f"  {i}. {video_id}: {title}... ({refs} refs)")

        # Write to results.json.b64 (base64 encoded)
        print(f"\n📝 Writing to results.json.b64...")
        encoded_data = base64.b64encode(
            json.dumps(videos, separators=(',', ':')).encode('utf-8')
        ).decode('utf-8')

        with open('results.json.b64', 'w', encoding='utf-8') as f:
            f.write(encoded_data)

        # Write to results.json (plain JSON for GitHub Pages)
        print(f"📝 Writing to results.json...")
        with open('results.json', 'w', encoding='utf-8') as f:
            json.dump(videos, f, separators=(',', ':'))

        # Create backup
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = f'backups/sync_from_render_{timestamp}.json.b64'

        import os
        os.makedirs('backups', exist_ok=True)

        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(encoded_data)

        print(f"🔒 Backup created: {backup_file}")

        # Update local database
        print(f"\n💾 Updating local SQLite database...")

        from app import app, Video, db

        with app.app_context():
            # Get existing video IDs
            existing_ids = {v.video_id for v in Video.query.all()}

            added = 0
            updated = 0

            for video_id, video_data in videos.items():
                video = Video.query.filter_by(video_id=video_id).first()

                if video:
                    # Update existing
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
                    updated += 1
                else:
                    # Create new
                    video = Video(
                        video_id=video_id,
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
                    added += 1

            db.session.commit()

            print(f"  ✅ Added {added} new videos")
            print(f"  ✅ Updated {updated} existing videos")

        print(f"\n✅ Sync complete!")
        print(f"📊 Total videos: {count}")
        print(f"\nNext steps:")
        print(f"  git add results.json results.json.b64 backups/")
        print(f"  git commit -m \"Sync database from Render - {count} videos\"")
        print(f"  git push origin main")

        return True

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        print(f"\nMake sure Render is deployed and accessible:")
        print(f"  {RENDER_URL}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = sync_from_render()
    sys.exit(0 if success else 1)
