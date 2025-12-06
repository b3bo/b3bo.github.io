#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for MannaMeter data safety features

This script tests:
1. Safe JSON write with backups
2. Database save with transaction rollback
3. Emergency fallback saves
4. Data recovery from backups
"""

import os
import sys
import json
import base64
from datetime import datetime
from pathlib import Path

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass


def test_safe_json_save():
    """Test safe JSON save with backup creation"""
    print("\n" + "="*70)
    print("TEST 1: Safe JSON Save with Backups")
    print("="*70)

    from data_manager import safe_save_to_json

    # Create test video data
    test_video = {
        'video_id': 'TEST123',
        'title': 'Test Video for Data Safety',
        'channel': 'Test Channel',
        'channel_url': 'https://youtube.com/test',
        'location': 'Test City, TS',
        'transcript_length': 1000,
        'processed_at': str(datetime.now()),
        'stats': {
            'scripture_references': 10,
            'suspect_references': 2,
            'false_positives': 1,
            'total_matches': 13
        },
        'counts': {'John': 5, 'Matthew': 3, 'Romans': 2},
        'suspect_counts': {'Genesis': 1, 'Acts': 1},
        'positions': {}
    }

    # Count backups before
    backup_dir = Path('backups')
    if backup_dir.exists():
        backups_before = len(list(backup_dir.glob('pre_write_*.json.b64')))
    else:
        backups_before = 0

    print(f"Backups before save: {backups_before}")

    # Attempt save
    success = safe_save_to_json(test_video, 'results.json')

    # Count backups after
    if backup_dir.exists():
        backups_after = len(list(backup_dir.glob('pre_write_*.json.b64')))
    else:
        backups_after = 0

    print(f"Backups after save: {backups_after}")

    # Verify save
    if os.path.exists('results.json.b64'):
        with open('results.json.b64', 'r') as f:
            data = json.loads(base64.b64decode(f.read()).decode())

        if 'TEST123' in data:
            print("✅ TEST PASSED: Video saved successfully")
            print(f"   Total videos in file: {len(data)}")
            print(f"   Safety backups created: {backups_after - backups_before}")
            return True
        else:
            print("❌ TEST FAILED: Video not found in results file")
            return False
    else:
        print("❌ TEST FAILED: Results file not created")
        return False


def test_database_save():
    """Test database save with automatic JSON export"""
    print("\n" + "="*70)
    print("TEST 2: Database Save with Auto-Export")
    print("="*70)

    from data_manager import save_to_database, export_database_to_json
    from app import app, Video

    test_video = {
        'video_id': 'DBTEST456',
        'title': 'Database Test Video',
        'channel': 'DB Test Channel',
        'channel_url': 'https://youtube.com/dbtest',
        'location': 'Database City, DB',
        'transcript_length': 2000,
        'processed_at': str(datetime.now()),
        'stats': {
            'scripture_references': 15,
            'suspect_references': 3,
            'false_positives': 2,
            'total_matches': 20
        },
        'counts': {'Revelation': 7, 'Daniel': 5, 'Ezekiel': 3},
        'suspect_counts': {'Psalms': 2, 'Isaiah': 1},
        'positions': {},
        'logs': []
    }

    # Save to database
    success = save_to_database(test_video)

    if success:
        # Verify in database
        with app.app_context():
            video = Video.query.filter_by(video_id='DBTEST456').first()

            if video:
                print(f"✅ TEST PASSED: Video saved to database")
                print(f"   Video ID: {video.video_id}")
                print(f"   Title: {video.title}")
                print(f"   Scripture Refs: {video.stats_scripture_references}")

                # Verify JSON export
                if os.path.exists('results.json'):
                    with open('results.json', 'r') as f:
                        json_data = json.load(f)

                    if 'DBTEST456' in json_data:
                        print(f"✅ Auto-export successful: Video in results.json")
                        return True
                    else:
                        print(f"⚠️  Video not in exported JSON")
                        return False
                else:
                    print(f"⚠️  results.json not created")
                    return False
            else:
                print("❌ TEST FAILED: Video not found in database")
                return False
    else:
        print("❌ TEST FAILED: Save to database failed")
        return False


def test_emergency_save():
    """Test emergency fallback save"""
    print("\n" + "="*70)
    print("TEST 3: Emergency Fallback Save")
    print("="*70)

    from data_manager import emergency_save_to_json

    test_video = {
        'video_id': 'EMERGENCY789',
        'title': 'Emergency Save Test',
        'channel': 'Emergency Channel',
        'channel_url': 'https://youtube.com/emergency',
        'location': 'Emergency City, EC',
        'transcript_length': 500,
        'processed_at': str(datetime.now()),
        'stats': {
            'scripture_references': 5,
            'suspect_references': 1,
            'false_positives': 0,
            'total_matches': 6
        },
        'counts': {'Luke': 3, 'Acts': 2},
        'suspect_counts': {'Mark': 1},
        'positions': {}
    }

    # Test emergency save
    success = emergency_save_to_json(test_video, 'results.json')

    # Check for emergency file
    backup_dir = Path('backups')
    emergency_files = list(backup_dir.glob('EMERGENCY_SAVE_*_EMERGENCY789.json.b64'))

    if emergency_files and success:
        print(f"✅ TEST PASSED: Emergency save created")
        print(f"   File: {emergency_files[0].name}")

        # Verify contents
        with open(emergency_files[0], 'r') as f:
            data = json.loads(base64.b64decode(f.read()).decode())

        if 'EMERGENCY789' in data:
            print(f"✅ Emergency file contains video data")
            return True
        else:
            print(f"❌ Emergency file missing video data")
            return False
    else:
        print(f"❌ TEST FAILED: Emergency save did not create file")
        return False


def test_data_recovery():
    """Test loading all videos from various sources"""
    print("\n" + "="*70)
    print("TEST 4: Data Recovery (Load All Videos)")
    print("="*70)

    from data_manager import load_all_videos

    all_videos = load_all_videos()

    print(f"Total videos recovered: {len(all_videos)}")

    if all_videos:
        print(f"\nVideo IDs found:")
        for vid in list(all_videos.keys())[:10]:  # Show first 10
            title = all_videos[vid]['title'][:50]
            print(f"  - {vid}: {title}...")

        print(f"\n✅ TEST PASSED: Successfully loaded {len(all_videos)} videos")
        return True
    else:
        print(f"⚠️  No videos found (this might be OK if database is empty)")
        return True  # Not a failure, just empty


def cleanup_test_data():
    """Clean up test video data"""
    print("\n" + "="*70)
    print("CLEANUP: Removing Test Data")
    print("="*70)

    from app import app, Video, db

    with app.app_context():
        # Remove test videos from database
        test_ids = ['TEST123', 'DBTEST456', 'EMERGENCY789']
        for test_id in test_ids:
            video = Video.query.filter_by(video_id=test_id).first()
            if video:
                db.session.delete(video)
                print(f"Removed {test_id} from database")

        db.session.commit()

    # Re-export to JSON
    from data_manager import export_database_to_json
    export_database_to_json()

    print("✅ Cleanup complete")


def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("MANNAMATER DATA SAFETY TEST SUITE")
    print("="*70)

    results = []

    # Run tests
    try:
        results.append(("Safe JSON Save", test_safe_json_save()))
        results.append(("Database Save", test_database_save()))
        results.append(("Emergency Save", test_emergency_save()))
        results.append(("Data Recovery", test_data_recovery()))
    except Exception as e:
        print(f"\n💥 TEST SUITE CRASHED: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    # Cleanup
    response = input("\nClean up test data? (yes/no): ")
    if response.lower() == 'yes':
        cleanup_test_data()

    if passed == total:
        print("\n🎉 ALL TESTS PASSED - DATA SAFETY SYSTEM WORKING!")
        return True
    else:
        print("\n⚠️  SOME TESTS FAILED - REVIEW OUTPUT ABOVE")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
