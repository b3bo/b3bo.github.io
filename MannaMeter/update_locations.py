#!/usr/bin/env python3
"""
Update existing results.json with location data for channels.
"""
import os
RESULTS_FILE = os.getenv('RESULTS_FILE', 'results.json')

import json
import os
from main import get_video_info, get_channel_location

def update_locations():
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
        print("No results.json or results.json.b64 found.")
        return

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
        import base64
        encoded_data = base64.b64encode(json.dumps(all_results, separators=(',', ':')).encode()).decode()
        with open(results_file + '.b64', 'w') as f:
            f.write(encoded_data)
        print("Updated results.json.b64 with location data.")
    else:
        print("No updates needed.")

if __name__ == "__main__":
    update_locations()