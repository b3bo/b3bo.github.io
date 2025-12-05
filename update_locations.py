#!/usr/bin/env python3
"""
Update existing results.json with location data for channels.
"""

import json
import os
from main import get_video_info, get_channel_location

def update_locations():
    results_file = 'results.json'
    if not os.path.exists(results_file):
        print("No results.json found.")
        return

    with open(results_file, 'r') as f:
        all_results = json.load(f)

    updated = False
    for video_id, video_data in all_results.items():
        if 'channel_url' not in video_data or 'location' not in video_data:
            print(f"Fetching data for {video_data['channel']}...")
            try:
                title, channel, channel_url = get_video_info(video_id)
                location = get_channel_location(channel_url)
                video_data['channel_url'] = channel_url
                video_data['location'] = location
                updated = True
                print(f"Added URL: {channel_url}, Location: {location}")
            except Exception as e:
                print(f"Error fetching data for {video_id}: {e}")
                if 'channel_url' not in video_data:
                    video_data['channel_url'] = ""
                if 'location' not in video_data:
                    video_data['location'] = ""

    if updated:
        with open(results_file, 'w') as f:
            json.dump(all_results, f, indent=2)
        print("Updated results.json with location data.")
    else:
        print("No updates needed.")

if __name__ == "__main__":
    update_locations()