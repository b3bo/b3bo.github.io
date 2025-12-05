#!/usr/bin/env python3
"""Reprocess all videos in results.json"""

import json
import os
import sys
from datetime import datetime
from main import get_video_info, get_transcript, count_keywords, BIBLE_BOOKS, get_channel_location, validate_channel_is_sermon

def main():
    try:
        results_file = 'results.json'
        
        print("=" * 50)
        print("MannaMeter Video Reprocessing")
        print("=" * 50)
        print()
        
        if not os.path.exists(results_file):
            print(f"ERROR: {results_file} not found!")
            return False
        
        with open(results_file, 'r') as f:
            all_results = json.load(f)
        
        total = len(all_results)
        print(f"Found {total} videos to reprocess")
        print()
        
        if total == 0:
            print("No videos found in results.json")
            return False
        
        current = 0
        for video_id, video_data in all_results.items():
            current += 1
            title = video_data.get('title', 'Unknown')[:50]
            print(f"[{current}/{total}] {title}")
            
            try:
                channel_url = video_data.get('channel_url', '')
                if not channel_url:
                    print("       [!] No channel URL found")
                    continue
                
                # Validate channel
                print("       Validating channel...", end=" ", flush=True)
                is_sermon_channel, description = validate_channel_is_sermon(channel_url)
                if not is_sermon_channel:
                    print(f"FAILED")
                    print(f"       [!] WARNING: Channel validation failed")
                    continue
                print("OK")
                
                # Get fresh data
                print("       Fetching video info...", end=" ", flush=True)
                title, channel, channel_url = get_video_info(video_id)
                print("OK")
                
                print("       Getting transcript...", end=" ", flush=True)
                location = get_channel_location(channel_url)
                transcript_text, transcript_snippets = get_transcript(video_id)
                print(f"OK ({len(transcript_text)} chars)")
                
                print("       Counting references...", end=" ", flush=True)
                counts, suspect_counts, positions, stats = count_keywords(transcript_text, BIBLE_BOOKS, transcript_snippets)
                print("OK")
                
                # Update entry
                full_counts = {book: counts.get(book, 0) for book in BIBLE_BOOKS}
                full_suspect_counts = {book: suspect_counts.get(book, 0) for book in BIBLE_BOOKS}
                
                all_results[video_id] = {
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
                
                refs = stats.get('scripture_references', 0)
                suspect = stats.get('suspect_references', 0)
                fp = stats.get('false_positives', 0)
                print(f"       [OK] Results: {refs} confirmed, {suspect} suspect, {fp} false positives")
                
            except Exception as e:
                print(f"       [ERROR] {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        # Save updated results
        print()
        print("Saving results...", end=" ", flush=True)
        with open(results_file, 'w') as f:
            json.dump(all_results, f, indent=2)
        print("OK")
        
        print()
        print("=" * 50)
        print(f"[SUCCESS] Reprocessing complete! Updated {total} videos.")
        print("=" * 50)
        return True
        
    except Exception as e:
        print(f"FATAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
