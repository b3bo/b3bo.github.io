# MannaMeter Data Architecture - Robust Storage Plan

## Executive Summary

**Problem:** Data loss occurring during video processing, causing need to reprocess videos repeatedly.

**Root Causes Identified:**
1. Dual storage systems (database + JSON file) not properly synchronized
2. No transactional writes - failures leave partial/corrupted data
3. No write verification after saves
4. Backup system incomplete (only covers JSON file, not database)
5. GitHub Pages deployment disconnected from live data

**Solution:** Implement database-first architecture with automatic JSON export, transactional writes, and comprehensive backup system.

---

## Proposed Architecture

### **Single Source of Truth: PostgreSQL Database (on Render.com)**

**Why Database First:**
- ✅ ACID transactions prevent partial writes
- ✅ Render.com provides automatic backups (on paid plans)
- ✅ No file system corruption risks
- ✅ Concurrent access safe (CLI + web interface)
- ✅ Built-in data integrity constraints

**Why Not JSON File First:**
- ❌ No transaction support (write failures = data loss)
- ❌ File corruption risk
- ❌ Concurrent writes dangerous
- ❌ No automatic backups on Render

### **Data Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                     VIDEO PROCESSING                         │
│  (CLI: main.py  OR  Web: app.py)                            │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │  1. WRITE TO DATABASE         │
        │     (Primary Storage)         │
        │  - Transactional write        │
        │  - Auto-retry on failure      │
        │  - Verify write succeeded     │
        └───────────────┬───────────────┘
                        ↓
        ┌───────────────────────────────┐
        │  2. AUTO-BACKUP TO JSON       │
        │     (Redundancy + GitHub)     │
        │  - Export DB → results.json   │
        │  - Base64 encode              │
        │  - Verify file written        │
        └───────────────┬───────────────┘
                        ↓
        ┌───────────────────────────────┐
        │  3. CREATE BACKUP SNAPSHOT    │
        │  - DB backup (weekly auto)    │
        │  - JSON backup (every write)  │
        │  - Both to backups/ folder    │
        └───────────────────────────────┘
```

---

## Implementation Plan

### **Phase 1: Immediate Fixes (Stop Data Loss NOW)**

#### 1.1 Add Transaction Wrapper to main.py
**File:** `main.py`

**Changes:**
```python
# Replace direct file writes with database writes
def save_video_data(video_data):
    from app import app, Video, db
    import json

    with app.app_context():
        # Start transaction
        try:
            # Check if video exists
            video = Video.query.filter_by(video_id=video_data['video_id']).first()

            if video:
                # Update existing
                video.title = video_data['title']
                video.channel = video_data['channel']
                # ... update all fields
            else:
                # Create new
                video = Video(
                    video_id=video_data['video_id'],
                    title=video_data['title'],
                    channel=video_data['channel'],
                    channel_url=video_data.get('channel_url'),
                    location=video_data.get('location'),
                    transcript_length=video_data.get('transcript_length'),
                    stats_scripture_references=video_data['stats']['scripture_references'],
                    stats_suspect_references=video_data['stats']['suspect_references'],
                    stats_false_positives=video_data['stats']['false_positives'],
                    stats_total_matches=video_data['stats']['total_matches'],
                    counts_data=json.dumps(video_data['counts']),
                    suspect_counts_data=json.dumps(video_data['suspect_counts']),
                    positions_data=json.dumps(video_data['positions'])
                )
                db.session.add(video)

            # Commit transaction
            db.session.commit()

            # VERIFY write succeeded
            verify = Video.query.filter_by(video_id=video_data['video_id']).first()
            if not verify:
                raise Exception("Write verification failed - video not in database")

            print(f"✅ Video saved to database: {video_data['video_id']}")

            # Now export to JSON as backup
            export_database_to_json()

            return True

        except Exception as e:
            db.session.rollback()
            print(f"❌ ERROR saving video: {e}")

            # EMERGENCY: Save to JSON file directly as fallback
            print("🚨 Attempting emergency save to JSON file...")
            emergency_save_to_json(video_data)

            return False
```

#### 1.2 Auto-Export After Every Write
**File:** `main.py`

```python
def export_database_to_json():
    """Export entire database to results.json.b64"""
    from app import app, Video
    import json
    import base64

    with app.app_context():
        videos = Video.query.all()
        all_results = {v.video_id: v.to_dict() for v in videos}

        # Write to results.json.b64
        encoded_data = base64.b64encode(
            json.dumps(all_results, separators=(',', ':')).encode()
        ).decode()

        with open('results.json.b64', 'w') as f:
            f.write(encoded_data)

        # ALSO write plain JSON for GitHub Pages
        with open('results.json', 'w') as f:
            json.dump(all_results, f, separators=(',', ':'))

        print(f"✅ Exported {len(all_results)} videos to JSON files")
```

#### 1.3 Emergency Fallback Save
**File:** `main.py`

```python
def emergency_save_to_json(video_data):
    """Emergency fallback if database write fails"""
    import json
    import base64
    import os
    from datetime import datetime

    # Load existing data
    if os.path.exists('results.json.b64'):
        with open('results.json.b64', 'r') as f:
            all_results = json.loads(base64.b64decode(f.read()).decode())
    else:
        all_results = {}

    # Add new video
    all_results[video_data['video_id']] = video_data

    # Save with timestamp backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f'backups/emergency_save_{timestamp}.json.b64'

    encoded_data = base64.b64encode(
        json.dumps(all_results, separators=(',', ':')).encode()
    ).decode()

    # Write to both main file and emergency backup
    with open('results.json.b64', 'w') as f:
        f.write(encoded_data)

    os.makedirs('backups', exist_ok=True)
    with open(backup_file, 'w') as f:
        f.write(encoded_data)

    print(f"🚨 EMERGENCY SAVE SUCCESSFUL: {backup_file}")
```

---

### **Phase 2: Comprehensive Backup System**

#### 2.1 Extend backup_util.py for Database Backups
**File:** `backup_util.py`

**Add new methods:**
```python
def backup_database(self):
    """Backup database to JSON file"""
    from app import app, Video
    import json
    import base64
    from datetime import datetime

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"database_backup_{timestamp}.json.b64"
    backup_path = self.backup_dir / backup_name

    with app.app_context():
        videos = Video.query.all()
        all_results = {v.video_id: v.to_dict() for v in videos}

        encoded_data = base64.b64encode(
            json.dumps(all_results, separators=(',', ':')).encode()
        ).decode()

        with open(backup_path, 'w') as f:
            f.write(encoded_data)

        print(f"Database backup created: {backup_path}")
        return backup_path

def restore_database(self, backup_path):
    """Restore database from backup JSON"""
    from app import app, Video, db
    import json
    import base64

    # Verify backup first
    if not self.verify_backup(backup_path):
        print("Backup verification failed - aborting restore")
        return False

    # Create safety backup before restore
    print("Creating safety backup of current database...")
    self.backup_database()

    # Load backup data
    with open(backup_path, 'r') as f:
        encoded_data = f.read()

    decoded_data = base64.b64decode(encoded_data).decode()
    all_results = json.loads(decoded_data)

    # Restore to database
    with app.app_context():
        # Clear existing data
        Video.query.delete()

        # Insert backup data
        for video_id, video_data in all_results.items():
            video = Video(
                video_id=video_id,
                title=video_data['title'],
                channel=video_data['channel'],
                # ... all fields
            )
            db.session.add(video)

        db.session.commit()
        print(f"Restored {len(all_results)} videos to database")

        # Export to JSON
        export_database_to_json()

    return True
```

#### 2.2 Scheduled Automatic Backups
**File:** `backup_scheduler.py` (NEW)

```python
"""
Automatic backup scheduler for MannaMeter
Run this as a background process or cron job
"""
import schedule
import time
from backup_util import MannaMeterBackup
from datetime import datetime

backup = MannaMeterBackup()

def daily_backup():
    print(f"[{datetime.now()}] Running scheduled database backup...")
    backup.backup_database()
    backup.cleanup_old_backups(keep_days=30, keep_count=20)

# Schedule daily backup at 2 AM
schedule.every().day.at("02:00").do(daily_backup)

# Also backup every 6 hours as safety
schedule.every(6).hours.do(backup.backup_database)

print("Backup scheduler started...")
while True:
    schedule.run_pending()
    time.sleep(60)  # Check every minute
```

---

### **Phase 3: Render.com Integration**

#### 3.1 Environment Configuration
**File:** `render.yaml` (for Render.com)

```yaml
services:
  - type: web
    name: mannameter
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn app:app"
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: mannameter-db
          property: connectionString
      - key: PYTHON_VERSION
        value: 3.11.0

databases:
  - name: mannameter-db
    databaseName: mannameter
    user: mannameter
    plan: starter  # $7/month includes daily backups
```

#### 3.2 Deployment Script
**File:** `deploy.sh` (NEW)

```bash
#!/bin/bash
# Pre-deployment script

# 1. Backup database to JSON
python -c "from backup_util import MannaMeterBackup; MannaMeterBackup().backup_database()"

# 2. Export database to results.json for GitHub Pages
python -c "from main import export_database_to_json; export_database_to_json()"

# 3. Commit and push
git add results.json results.json.b64 backups/
git commit -m "Auto-backup before deployment $(date +'%Y-%m-%d %H:%M')"
git push origin main

echo "✅ Deployment preparation complete"
```

---

### **Phase 4: Recovery Tools**

#### 4.1 Data Recovery Script
**File:** `recover_data.py` (NEW)

```python
#!/usr/bin/env python3
"""
Emergency data recovery tool
"""
import argparse
from backup_util import MannaMeterBackup
from pathlib import Path
import json
import base64

def find_all_video_data():
    """Scan all backups and find unique videos"""
    backup = MannaMeterBackup()
    all_videos = {}

    backups = list(backup.backup_dir.glob("*.json.b64"))
    print(f"Scanning {len(backups)} backups...")

    for backup_file in backups:
        try:
            with open(backup_file, 'r') as f:
                data = json.loads(base64.b64decode(f.read()).decode())

            for video_id, video_data in data.items():
                if video_id not in all_videos:
                    all_videos[video_id] = video_data
                    print(f"  Found: {video_id} - {video_data['title'][:50]}")
        except Exception as e:
            print(f"  ⚠️  Skipped corrupted backup: {backup_file.name}")

    return all_videos

def merge_and_restore():
    """Merge all backups and restore to database"""
    all_videos = find_all_video_data()

    print(f"\n📊 Total unique videos found: {len(all_videos)}")

    response = input("Restore all videos to database? (yes/no): ")
    if response.lower() != 'yes':
        print("Aborted")
        return

    from app import app, Video, db

    with app.app_context():
        for video_id, video_data in all_videos.items():
            video = Video.query.filter_by(video_id=video_id).first()
            if not video:
                # Create new video
                video = Video(
                    video_id=video_id,
                    # ... all fields
                )
                db.session.add(video)

        db.session.commit()
        print(f"✅ Restored {len(all_videos)} videos")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scan", action="store_true", help="Scan all backups")
    parser.add_argument("--restore", action="store_true", help="Restore all found videos")
    args = parser.parse_args()

    if args.scan:
        find_all_video_data()
    elif args.restore:
        merge_and_restore()
    else:
        parser.print_help()
```

---

## Cost Analysis

### Current Render.com Costs (Estimated)

**Option 1: Free Tier**
- Web service: Free (with 750 hours/month limit)
- Database: **NO DATABASE ON FREE TIER** ⚠️
- Backups: None
- **Total: $0/month** (but no database = data loss risk!)

**Option 2: Starter Database (RECOMMENDED)**
- Web service: Free or $7/month
- Database: **$7/month** (includes daily backups)
- Backups: Automatic daily snapshots
- **Total: $7-14/month**

**Option 3: Professional**
- Web service: $25/month
- Database: $20/month (more storage, point-in-time recovery)
- **Total: $45/month**

### Recommendation
**Go with Starter Database ($7/month)** - provides:
- Persistent PostgreSQL database
- Automatic daily backups (7-day retention)
- Prevents all data loss issues
- Professional deployment

---

## Migration Steps (Zero Data Loss)

### Step 1: Backup Everything
```bash
cd MannaMeter
python backup_util.py backup         # Backup current JSON
python backup_util.py verify --all   # Verify all backups
```

### Step 2: Verify Database
```bash
python -c "from app import app, Video; app.app_context().push(); print(f'Videos in DB: {Video.query.count()}')"
```

### Step 3: Run Recovery Tool
```bash
python recover_data.py --scan        # Find all videos
python recover_data.py --restore     # Restore to database
```

### Step 4: Update main.py
- Replace file writes with database writes
- Add transaction wrappers
- Add verification checks

### Step 5: Deploy to Render
- Set up Render.com with PostgreSQL
- Deploy updated code
- Verify data migrated

---

## Maintenance Procedures

### Daily (Automated)
- ✅ Auto-backup database to JSON
- ✅ Auto-export to results.json for GitHub Pages
- ✅ Auto-cleanup old backups (keep last 20)

### Weekly (Manual - 5 minutes)
```bash
# Verify backups
python backup_util.py verify --all

# Check stats
python backup_util.py stats
```

### Monthly (Manual - 10 minutes)
```bash
# Download Render.com database backup
render db:download mannameter-db

# Store offsite (Google Drive, Dropbox, etc.)
```

---

## Success Metrics

After implementation, you should have:

1. **Zero Data Loss**
   - ✅ Transactional writes
   - ✅ Write verification
   - ✅ Emergency fallback saves
   - ✅ Multiple backup copies

2. **Easy Recovery**
   - ✅ One-command restore from any backup
   - ✅ Automatic daily backups
   - ✅ Scan tool finds all videos across all backups

3. **Low Maintenance**
   - ✅ Automated backups
   - ✅ Automated JSON export
   - ✅ No manual sync needed

4. **Cost Effective**
   - ✅ $7/month for professional database
   - ✅ Automatic backups included
   - ✅ No surprise costs

---

## Next Steps - Choose Your Path

### Path A: Quick Fix (1 hour)
Implement Phase 1 only - adds transaction safety and emergency saves to current setup.

### Path B: Recommended Solution (3-4 hours)
Implement Phases 1-3 - full database-first architecture with Render.com deployment.

### Path C: Nuclear Option (30 minutes)
Just upgrade Render to use database, run recovery tool, done.

**What would you like to do?**
