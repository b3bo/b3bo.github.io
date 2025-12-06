#!/usr/bin/env python3
"""
Fix HTML-encoded titles in existing videos
"""

import os
import sys
from datetime import datetime

# Add the current directory to the path so we can import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Video
from main import get_video_info

def fix_video_titles():
    """Reprocess all videos to fix HTML-encoded titles."""
    with app.app_context():
        videos = Video.query.all()
        fixed_count = 0
        
        print(f"Processing {len(videos)} videos...")
        
        for video in videos:
            try:
                # Re-fetch video info to get properly decoded title
                title, channel, channel_url = get_video_info(video.video_id)
                
                # Check if title changed
                if title != video.title:
                    print(f"Fixing: '{video.title}' -> '{title}'")
                    video.title = title
                    video.channel = channel  # Also update channel while we're at it
                    video.channel_url = channel_url
                    fixed_count += 1
                else:
                    print(f"No change needed for: '{video.title}'")
                    
            except Exception as e:
                print(f"Error processing video {video.video_id}: {e}")
                continue
        
        # Commit all changes
        if fixed_count > 0:
            db.session.commit()
            print(f"\nFixed {fixed_count} video titles")
        else:
            print("\nNo titles needed fixing")

if __name__ == "__main__":
    fix_video_titles()