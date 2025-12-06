#!/usr/bin/env python3
import os
os.environ['FLASK_ENV'] = 'development'
from app import app, db, Video

with app.app_context():
    videos_db = Video.query.order_by(Video.processed_at.desc()).all()
    videos = [video.to_dict() for video in videos_db]
    
    print(f'Total videos: {len(videos)}')
    print()
    
    # Calculate totals
    total_refs = 0
    total_suspect = 0
    total_fp = 0
    
    for video in videos:
        refs = video.get('stats', {}).get('scripture_references', 0)
        suspect = video.get('stats', {}).get('suspect_references', 0)
        fp = video.get('stats', {}).get('false_positives', 0)
        
        title = video['title']
        print(f'Video: {title}')
        print(f'  Stats: refs={refs}, suspect={suspect}, fp={fp}')
        
        total_refs += refs
        total_suspect += suspect
        total_fp += fp
    
    print()
    print(f'TOTALS: refs={total_refs}, suspect={total_suspect}, fp={total_fp}')
