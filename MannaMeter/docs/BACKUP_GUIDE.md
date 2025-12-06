# MannaMeter Backup Guide

**Updated:** December 6, 2025 - Now includes automatic safety backups and persistent disk support

---

## Overview

MannaMeter includes a **comprehensive multi-layer backup system** to protect your sermon analysis data. Every write operation creates automatic safety backups, and you have multiple recovery options if anything goes wrong.

**New in Version 1.0.5:**
- ✅ Automatic safety backups on every video save
- ✅ Database-first architecture with automatic JSON exports
- ✅ Emergency fallback saves
- ✅ Persistent disk support for Render deployments
- ✅ Automatic database initialization from JSON backups

---

## Backup System Architecture

### Three-Layer Protection

**Layer 1: Automatic Safety Backups** (Every Write)
- Created before any data changes
- Located in `backups/pre_write_TIMESTAMP.json.b64`
- Automatic recovery from latest backup if corruption detected
- **You don't need to do anything** - happens automatically

**Layer 2: Database + JSON Dual Storage**
- Primary: PostgreSQL/SQLite database (ACID transactions)
- Backup: Automatic export to `results.json` and `results.json.b64`
- Both stay synchronized automatically
- JSON files pushed to GitHub for offsite backup

**Layer 3: Manual Backups** (On Demand)
- Use `backup_util.py` for manual snapshots
- Create before major changes
- Name format: `database_backup_TIMESTAMP.json.b64`

---

## Quick Start

### Automatic Backups (Already Working)

**Every time you process a video:**

```bash
python main.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

**Automatically creates:**
1. Pre-write safety backup in `backups/pre_write_*.json.b64`
2. Saves to database (PostgreSQL or SQLite)
3. Exports to `results.json` and `results.json.b64`
4. Commits and pushes to GitHub (if using deployment script)

**You get 3 copies automatically:**
- Database (persistent disk on Render)
- JSON files (pushed to GitHub)
- Safety backups (in backups/ folder)

---

### Manual Backups (Optional)

**Create a manual backup before major changes:**

```bash
cd MannaMeter
python backup_util.py backup
```

**List all backups:**

```bash
python backup_util.py list
```

**Restore from backup:**

```bash
python backup_util.py restore
```

---

## Command Reference

### CLI Commands

#### `python backup_util.py backup`
Creates a timestamped manual backup of your current database.

- **Location**: `backups/database_backup_YYYYMMDD_HHMMSS.json.b64`
- **Source**: Exports all videos from database
- **Safety**: Non-destructive - creates new file without modifying existing data
- **When to use**: Before major changes, migrations, or testing

**Example:**
```bash
$ python backup_util.py backup

Creating database backup...
✅ Backup created: backups/database_backup_20251206_120000.json.b64
📊 Backed up 2 videos
```

---

#### `python backup_util.py list`
Shows all available backups with timestamps, types, and file sizes.

**Example output:**
```bash
$ python backup_util.py list

Available backups (newest first):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # │ Type              │ Timestamp           │ Size
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  0 │ Pre-Migration     │ 2025-12-06 11:46:52 │ 68.5 KB
  1 │ Pre-Write Safety  │ 2025-12-06 10:25:15 │ 68.5 KB
  2 │ Manual Backup     │ 2025-12-06 10:23:37 │ 68.5 KB
  3 │ Database Backup   │ 2025-12-05 14:30:22 │ 34.2 KB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total: 4 backups, 239.7 KB
```

**Backup types:**
- **Pre-Write Safety** - Automatic backups before every save
- **Manual Backup** - Created with `backup_util.py backup`
- **Database Backup** - Manual database snapshots
- **Pre-Migration** - Created before persistent disk migration
- **Emergency Save** - Last-resort fallback if all else fails

---

#### `python backup_util.py restore`
Restores from the most recent backup.

- **Safety**: Automatically creates a backup of current state before restoring
- **Backup name**: `database_backup_before_restore_TIMESTAMP.json.b64`
- **Confirmation**: Prompts before overwriting data

**Example:**
```bash
$ python backup_util.py restore

⚠️  This will replace current database with backup data
Current state will be backed up first as safety measure

Restore from: backups/pre_migration_20251206_114652.json.b64
Continue? (yes/no): yes

🔒 Creating safety backup before restore...
✅ Safety backup created: backups/database_backup_before_restore_20251206_120500.json.b64

Restoring from backup...
  ✓ AFhG09L0LXA: John 5:24...
  ✓ b47CJlE-ut0: Saved or Self-Deceived...

✅ Restored 2 videos from backup
```

**Restore specific backup:**
```bash
# By index (from list command)
python backup_util.py restore --index 2

# By name (partial match)
python backup_util.py restore --name "20251205"
```

---

#### `python backup_util.py cleanup`
Removes old backups to save disk space.

- **Default**: Keeps last 10 backups, deletes backups older than 30 days
- **Smart**: Never deletes emergency saves or migration backups
- **Safe**: Shows what will be deleted before confirming

**Example:**
```bash
$ python backup_util.py cleanup

Cleanup will remove backups:
  - Older than 30 days (keeps newest 10)

Backups to delete:
  - pre_write_20251105_143022.json.b64 (31 days old, 34 KB)
  - pre_write_20251104_120000.json.b64 (32 days old, 34 KB)

Total to delete: 2 files, 68 KB
Continue? (yes/no): yes

✅ Deleted 2 old backups, freed 68 KB
```

**Custom retention:**
```bash
# Keep more backups
python backup_util.py cleanup --keep-count 20

# Keep backups longer
python backup_util.py cleanup --keep-days 90

# Aggressive cleanup (development only)
python backup_util.py cleanup --keep-count 5 --keep-days 7
```

---

#### `python backup_util.py stats`
Shows backup statistics including total size, date ranges, and types.

**Example:**
```bash
$ python backup_util.py stats

Backup Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Backups:        12
Total Size:           408.5 KB
Average Size:         34.0 KB

Oldest Backup:        2025-11-15 09:30:00
Newest Backup:        2025-12-06 11:46:52

By Type:
  Pre-Write Safety:   8 backups
  Manual Backup:      2 backups
  Database Backup:    1 backup
  Pre-Migration:      1 backup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

#### `python backup_util.py verify`
Checks backup file integrity (JSON parsing, base64 decoding, data structure).

**Verify all backups:**
```bash
$ python backup_util.py verify --all

Verifying all backups...
  ✓ pre_migration_20251206_114652.json.b64 (2 videos)
  ✓ pre_write_20251206_102515.json.b64 (2 videos)
  ✓ database_backup_20251206_102337.json.b64 (2 videos)
  ✗ EMERGENCY_SAVE_20251205_corrupted.json.b64 (FAILED: Invalid JSON)

✅ 3/4 backups verified successfully
⚠️  1 backup(s) failed verification
```

**Verify specific backup:**
```bash
python backup_util.py verify --name "pre_migration"
```

---

## Web Interface

### Accessing Backup Management

**Local development:**
1. Start MannaMeter: `python app.py`
2. Navigate to: `http://localhost:5000/backup`

**Render deployment:**
- Visit: `https://mannameter.onrender.com/backup`

### Features

- ✅ Create new backups with one click
- ✅ View backup list with timestamps and sizes
- ✅ Restore from backups (with safety backup)
- ✅ View backup statistics
- ✅ Download backups as files

### API Endpoints

#### Create Backup
```http
POST /api/backup/create

Response:
{
  "success": true,
  "message": "Backup created: database_backup_20251206_120000.json.b64",
  "filename": "database_backup_20251206_120000.json.b64",
  "size_kb": 68.5,
  "video_count": 2
}
```

#### List Backups
```http
GET /api/backup/list

Response:
{
  "success": true,
  "backups": [
    {
      "filename": "pre_migration_20251206_114652.json.b64",
      "type": "Pre-Migration",
      "timestamp": "2025-12-06 11:46:52",
      "size_kb": 68.5,
      "video_count": 2
    },
    ...
  ]
}
```

#### Restore Backup
```http
POST /api/backup/restore/{backup_name}

Response:
{
  "success": true,
  "message": "Restored 2 videos from backup",
  "safety_backup": "database_backup_before_restore_20251206_120500.json.b64",
  "restored_count": 2
}
```

#### Get Statistics
```http
GET /api/backup/stats

Response:
{
  "success": true,
  "stats": {
    "total_backups": 12,
    "total_size_kb": 408.5,
    "oldest_backup": "2025-11-15 09:30:00",
    "newest_backup": "2025-12-06 11:46:52",
    "by_type": {
      "Pre-Write Safety": 8,
      "Manual Backup": 2,
      "Database Backup": 1,
      "Pre-Migration": 1
    }
  }
}
```

---

## Automatic Backup Types

### Pre-Write Safety Backups

**Created:** Before every video save operation

**Location:** `backups/pre_write_YYYYMMDD_HHMMSS.json.b64`

**Purpose:** Protect against corruption during write operations

**How it works:**
```python
# Automatic in data_manager.py
if os.path.exists(results_path):
    backup_file = f"backups/pre_write_{timestamp}.json.b64"
    shutil.copy2(results_path, backup_file)
    print(f"🔒 Safety backup created: {backup_file}")
```

**Retention:** Cleaned up by `backup_util.py cleanup` (default: 30 days)

---

### Emergency Fallback Saves

**Created:** If all normal save methods fail

**Location:** `backups/EMERGENCY_SAVE_YYYYMMDD_HHMMSS_VIDEOID.json.b64`

**Purpose:** Last resort - ensure data is never lost

**When triggered:**
- Database save fails
- JSON save fails
- File system errors
- Corruption detected

**Contains:** Just the current video being processed (not all videos)

**Recovery:**
```bash
# Emergency saves need manual merge
python -c "
from data_manager import load_all_videos
videos = load_all_videos()  # Scans database + JSON + emergency saves
print(f'Recovered {len(videos)} videos total')
"
```

---

### Pre-Migration Backups

**Created:** By `migrate_to_persistent_disk.py` before switching storage

**Location:** `backups/pre_migration_YYYYMMDD_HHMMSS.json.b64`

**Purpose:** Full snapshot before major infrastructure changes

**Contains:** Complete database export at moment of migration

**Special:** Never auto-deleted by cleanup script

---

### Pre-Restore Safety Backups

**Created:** By `backup_util.py restore` before overwriting database

**Location:** `backups/database_backup_before_restore_YYYYMMDD_HHMMSS.json.b64`

**Purpose:** Undo restore if needed

**Example use case:**
```bash
# Restore from backup
python backup_util.py restore --index 2

# Oops, wrong backup! Undo it:
python backup_util.py restore --name "before_restore"
```

---

## Persistent Disk & Render Deployment

### How Backups Work on Render

**With PostgreSQL (old setup):**
- ❌ Database can reset on crashes
- ✅ JSON backups survive (in Git)
- ✅ Auto-loads from JSON on startup if database empty

**With Persistent Disk (new setup):**
- ✅ SQLite database survives crashes and redeployments
- ✅ JSON backups continue (pushed to GitHub)
- ✅ Auto-loads from JSON only if disk database is empty
- ✅ Backups in `backups/` folder also survive on persistent disk

### Backup Storage Locations

**On Render with Persistent Disk:**
```
/mnt/data/
├── mannameter.db           # SQLite database (survives restarts)
└── (backups/ are in Git repo, not on disk)

/opt/render/project/src/MannaMeter/
├── results.json            # Auto-exported (in Git)
├── results.json.b64        # Auto-exported (in Git)
├── backups/                # In Git, pushed with commits
│   ├── pre_write_*.json.b64
│   ├── database_backup_*.json.b64
│   └── pre_migration_*.json.b64
```

**On GitHub (offsite backup):**
```
b3bo.github.io/MannaMeter/
├── results.json            # For GitHub Pages dashboard
├── results.json.b64        # For database auto-load
├── backups/                # Manual and migration backups
```

### Automatic Database Initialization

**On every Render startup:**

```python
# app.py
with app.app_context():
    db.create_all()

# If database is empty, auto-load from JSON
from init_database import init_database_from_json
init_database_from_json()
```

**This means:**
- Fresh deployment with empty disk: Loads from `results.json.b64`
- Existing deployment with data: Uses existing database
- Database corruption: Delete disk, redeploy, auto-loads from JSON

---

## Recovery Scenarios

### Scenario 1: Accidental Video Deletion

**Problem:** Deleted a video from the web interface

**Solution:**
```bash
# Restore from most recent backup
python backup_util.py restore

# Or restore from before the deletion
python backup_util.py list
python backup_util.py restore --index 0
```

---

### Scenario 2: Database Corruption

**Problem:** Database file corrupted, app won't start

**Solution:**

**On Render:**
1. Delete persistent disk in Render dashboard
2. Recreate disk with same mount path (`/mnt/data`)
3. Redeploy
4. `init_database.py` auto-loads from `results.json.b64`

**Locally:**
```bash
# Restore from latest backup
python backup_util.py restore
```

---

### Scenario 3: Render 502 Crash (Data Loss)

**Problem:** Render crashed with 502 error, database reset

**What happens automatically:**
1. Render restarts service
2. If using **persistent disk**: Database survives, no data loss
3. If using **PostgreSQL**: Database empty, auto-loads from `results.json.b64`

**Manual recovery (if auto-load fails):**
```bash
# Find latest backup
python backup_util.py list

# Restore from before crash
python backup_util.py restore --index 0
```

---

### Scenario 4: All Backups Corrupted

**Problem:** JSON and database both corrupted

**Solution:**

**1. Check for emergency saves:**
```bash
ls backups/EMERGENCY_SAVE_*
```

**2. Load from all sources:**
```python
from data_manager import load_all_videos

# Scans: database + JSON + all backups + emergency saves
all_videos = load_all_videos()
print(f"Found {len(all_videos)} videos total")
```

**3. Check GitHub commit history:**
```bash
# Download older version of results.json.b64 from GitHub
git log --all -- results.json.b64
git checkout <commit-hash> -- results.json.b64
```

---

### Scenario 5: Need Offsite Backup

**Problem:** Want backups outside of Render/GitHub

**Solution:**

**Monthly offsite backup:**
```bash
# 1. Create manual backup
python backup_util.py backup

# 2. Download backups folder
# Copy C:\Users\johnb\Documents\GitHub\b3bo.github.io\MannaMeter\backups\
# to Google Drive, Dropbox, external drive, etc.

# 3. Also download results.json.b64 as plain text backup
```

**Automated (optional):**
```batch
REM Create scheduled task (Windows)
REM backups/weekly_backup.bat

cd C:\Users\johnb\Documents\GitHub\b3bo.github.io\MannaMeter
python backup_util.py backup
xcopy backups\ "D:\Offsite\MannaMeter\backups\" /E /Y
```

---

## Best Practices

### Regular Maintenance

**Weekly:**
- ✅ Check that automatic backups are working
- ✅ Verify latest backup with `python backup_util.py verify --all`

**Monthly:**
- ✅ Download offsite backup to Google Drive/Dropbox
- ✅ Clean up old backups: `python backup_util.py cleanup`
- ✅ Check backup statistics: `python backup_util.py stats`

**Before major changes:**
- ✅ Create manual backup: `python backup_util.py backup`
- ✅ Test restore functionality

---

### Storage Planning

**Backup sizes (approximate):**
- Empty database: ~1 KB
- 10 videos: ~350 KB
- 100 videos: ~3.5 MB
- 1,000 videos: ~35 MB

**Retention recommendations:**
- **Development:** Keep 5-10 backups, 7-14 days
- **Production:** Keep 10-20 backups, 30-90 days
- **Critical data:** Keep all backups, monthly offsite copies

**Persistent disk capacity:**
- 1 GB disk = ~31,000 videos worth of backups
- Keep 20 backups @ 3.5 MB each = ~70 MB = 7% of disk
- Plenty of room for backups

---

### Testing & Verification

**Monthly verification:**
```bash
# Verify all backups are intact
python backup_util.py verify --all

# Test restore (on development environment)
python backup_util.py restore --index 1
```

**After migrations or major changes:**
```bash
# Create verification backup
python backup_util.py backup

# Verify it contains expected data
python backup_util.py stats
```

---

## Troubleshooting

### "No backups found"

**Cause:** `backups/` directory doesn't exist or is empty

**Fix:**
```bash
# Create directory
mkdir backups

# Create first backup
python backup_util.py backup
```

---

### "Backup corrupted" or verification fails

**Diagnosis:**
```bash
# Check which backups are corrupted
python backup_util.py verify --all
```

**Fix:**
```bash
# Restore from a good backup
python backup_util.py list
python backup_util.py restore --index <good_backup_index>
```

**Prevention:**
- Check disk space before saves
- Verify backups regularly
- Keep offsite copies

---

### "Permission denied" errors

**Cause:** No write access to `backups/` directory

**Fix (Windows):**
```bash
# Check directory permissions
icacls backups

# Grant full control
icacls backups /grant Users:F
```

**Fix (Linux/Mac):**
```bash
chmod 755 backups
chmod 644 backups/*.json.b64
```

---

### "Database empty after restore"

**Cause:** Restored from wrong backup or backup was empty

**Check:**
```bash
# View backup before restoring
python -c "
import json, base64
with open('backups/BACKUP_NAME.json.b64', 'r') as f:
    data = json.loads(base64.b64decode(f.read()))
print(f'Backup contains {len(data)} videos')
for vid_id in list(data.keys())[:5]:
    print(f'  - {vid_id}: {data[vid_id][\"title\"][:50]}')
"
```

**Fix:**
```bash
# Restore from different backup
python backup_util.py list
python backup_util.py restore --index <different_backup>
```

---

### Automatic backups filling disk space

**Check usage:**
```bash
python backup_util.py stats
```

**Clean up:**
```bash
# More aggressive cleanup
python backup_util.py cleanup --keep-count 5 --keep-days 14
```

**Disable automatic pre-write backups (not recommended):**
```python
# In data_manager.py, comment out backup creation
# Only do this if disk space is critical
```

---

## Security Notes

### Data Protection

- ✅ Backup files use same base64 encoding as main database
- ✅ No plaintext passwords or API keys in backups
- ✅ YouTube video IDs and transcripts are public data

### Encryption (optional)

**For sensitive sermon data:**

```bash
# Encrypt backup before offsite storage
gpg --encrypt --recipient your@email.com backup_file.json.b64

# Decrypt when needed
gpg --decrypt backup_file.json.b64.gpg > backup_file.json.b64
```

### Access Control

- ✅ `backups/` folder should not be publicly accessible
- ✅ `.gitignore` already excludes `backups/` from Git (except manual backups)
- ✅ Render persistent disk is private to your service

---

## File Structure

```
MannaMeter/
├── results.json.b64              # Main data file (base64 encoded)
├── results.json                  # Plain JSON (for GitHub Pages)
├── instance/
│   └── mannameter.db             # SQLite database (local development)
├── backups/                      # Backup directory
│   ├── pre_write_20251206_102515.json.b64        # Automatic safety backups
│   ├── pre_migration_20251206_114652.json.b64    # Migration backups
│   ├── database_backup_20251206_102337.json.b64  # Manual backups
│   ├── database_backup_before_restore_*.json.b64 # Pre-restore safety
│   └── EMERGENCY_SAVE_20251206_*.json.b64        # Emergency saves
├── backup_util.py                # Backup management CLI
├── data_manager.py               # Automatic backup system
└── init_database.py              # Auto-load from JSON on startup

Render (with persistent disk):
/mnt/data/
└── mannameter.db                 # SQLite database (survives restarts)
```

---

## Migration from Old Backup System

**If you have old backups from before v1.0.5:**

Old format: `results_backup_*.json.b64`
New format: `database_backup_*.json.b64`

**Both work identically** - just different naming convention.

**To migrate old backups:**
```bash
# Old backups still work with restore command
python backup_util.py restore --name "results_backup_20251205"

# Or rename for consistency (optional)
cd backups
ren results_backup_*.json.b64 database_backup_*.json.b64
```

---

## Summary

**You have 5 layers of protection:**

1. ✅ **Automatic pre-write safety backups** - Every save operation
2. ✅ **Database-first architecture** - ACID transactions
3. ✅ **Automatic JSON exports** - Pushed to GitHub
4. ✅ **Manual backups on demand** - Before major changes
5. ✅ **Emergency fallback saves** - Last resort

**Recovery time:**
- Recent deletion: < 1 minute (restore from latest backup)
- Database corruption: < 5 minutes (auto-load from JSON)
- Total disaster: < 30 minutes (offsite backup + restore)

**Cost:** $0 (all backups included, no extra storage fees)

**Reliability:** Triple redundancy (database + JSON + backups folder)

---

## Quick Reference Card

```bash
# Create manual backup
python backup_util.py backup

# List all backups
python backup_util.py list

# Restore from latest
python backup_util.py restore

# Restore specific backup
python backup_util.py restore --index 2

# Verify backups
python backup_util.py verify --all

# Check statistics
python backup_util.py stats

# Clean up old backups
python backup_util.py cleanup

# Help
python backup_util.py --help
```

---

For more information, see:
- `docs/IMPLEMENTATION_COMPLETE.md` - Data safety implementation details
- `docs/PERSISTENT_DISK_SETUP.md` - Render persistent disk migration guide
- `docs/SECURITY_AUDIT.md` - Security analysis and data protection
