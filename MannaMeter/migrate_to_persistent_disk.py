#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migrate data from PostgreSQL to persistent disk SQLite

This script is used once when switching from Render PostgreSQL to persistent disk.
It exports all data from the current database and imports it into the new SQLite location.

Usage:
    python migrate_to_persistent_disk.py
"""

import os
import sys
import json
import base64
from datetime import datetime

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

def migrate_database():
    """
    Export all data from current database and prepare for persistent disk migration

    Steps:
    1. Export current database to JSON backup
    2. Document migration steps for Render configuration
    """

    print("="*70)
    print("MIGRATE TO PERSISTENT DISK")
    print("="*70)

    # Import Flask app and models
    try:
        from app import app, Video, db
    except Exception as e:
        print(f"❌ Error importing app: {e}")
        print("\nMake sure you're in the MannaMeter directory:")
        print("  cd C:\\Users\\johnb\\Documents\\GitHub\\b3bo.github.io\\MannaMeter")
        return False

    # Step 1: Export current database to JSON
    print("\n📦 Step 1: Export current database to JSON backup")
    print("-"*70)

    try:
        with app.app_context():
            videos = Video.query.all()
            video_count = len(videos)

            if video_count == 0:
                print("⚠️  Database is empty - nothing to migrate")
                print("   If you expect data, check that DATABASE_URL is set correctly")
                return False

            print(f"Found {video_count} videos in current database")

            # Export to dictionary
            all_results = {}
            for video in videos:
                all_results[video.video_id] = video.to_dict()
                print(f"  ✓ {video.video_id}: {video.title[:50]}...")

            # Save to results.json.b64 (base64 encoded)
            encoded_data = base64.b64encode(
                json.dumps(all_results, separators=(',', ':')).encode('utf-8')
            ).decode('utf-8')

            with open('results.json.b64', 'w', encoding='utf-8') as f:
                f.write(encoded_data)

            # Save to results.json (plain JSON for GitHub Pages)
            with open('results.json', 'w', encoding='utf-8') as f:
                json.dump(all_results, f, separators=(',', ':'))

            # Save to migration backup
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            migration_backup = f'backups/pre_migration_{timestamp}.json.b64'
            os.makedirs('backups', exist_ok=True)

            with open(migration_backup, 'w', encoding='utf-8') as f:
                f.write(encoded_data)

            print(f"\n✅ Exported {video_count} videos to:")
            print(f"   - results.json.b64 (for auto-load on Render)")
            print(f"   - results.json (for GitHub Pages)")
            print(f"   - {migration_backup} (migration backup)")

    except Exception as e:
        print(f"❌ Error exporting database: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Step 2: Document migration steps
    print("\n📋 Step 2: Render Configuration Steps")
    print("-"*70)
    print("""
To complete the migration to persistent disk on Render:

1. **Add Persistent Disk to Render Service:**
   - Go to https://dashboard.render.com/
   - Select your MannaMeter service
   - Click "Disks" tab
   - Click "Add Disk"
   - Name: mannameter-data
   - Mount Path: /mnt/data
   - Size: 1 GB (free tier)
   - Click "Create"

2. **Add Environment Variable:**
   - Go to "Environment" tab
   - Add new variable:
     - Key: PERSISTENT_DISK_PATH
     - Value: /mnt/data
   - Click "Save Changes"

3. **Remove PostgreSQL Database (Optional - saves $7/month after trial):**
   - This will NOT delete your data (it's in JSON backups)
   - Go to "Environment" tab
   - Delete DATABASE_URL variable
   - OR: Keep both and it will prefer persistent disk

4. **Deploy:**
   - Commit and push these changes to GitHub
   - Render will auto-deploy
   - On startup, app will:
     a) Detect PERSISTENT_DISK_PATH environment variable
     b) Create SQLite database at /mnt/data/mannameter.db
     c) Auto-load data from results.json.b64 (if database is empty)
   - Your videos will appear on the live site

5. **Verify:**
   - Visit https://mannameter.onrender.com/
   - Confirm all videos are visible
   - Check Render logs for: "✅ Using persistent disk SQLite: /mnt/data/mannameter.db"

📊 **Benefits of Persistent Disk:**
- ✅ Free forever (1GB included)
- ✅ Survives crashes and redeployments
- ✅ No $7/month charge after trial
- ✅ Faster than PostgreSQL for small datasets
- ✅ No connection limits
- ✅ Data persists even if service stops

⚠️  **Important:**
- Persistent disk data is NOT in Git (stays on Render server)
- Automatic JSON exports continue (results.json pushed to GitHub)
- GitHub Pages dashboard stays in sync
- Manual backups still work (backup_util.py)
""")

    print("\n✅ Migration preparation complete!")
    print(f"📊 Exported {video_count} videos")
    print("📋 Follow the steps above to configure Render")

    return True


if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
