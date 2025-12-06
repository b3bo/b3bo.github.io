# Persistent Disk Setup Guide (Free & Reliable)

**Date:** December 6, 2025
**Solution:** Switch from PostgreSQL to SQLite on Render persistent disk
**Cost:** $0/month (vs $7/month for PostgreSQL after trial)
**Reliability:** Data survives crashes and redeployments

---

## Why Persistent Disk?

### Problem with PostgreSQL on Render (Free Tier):
- ❌ Resets on crashes (you experienced this with 502 error)
- ❌ $7/month after 90-day trial
- ❌ Connection limits
- ❌ Overkill for small datasets (2-100 videos)

### Persistent Disk Advantages:
- ✅ **Free forever** (1GB included with free web service)
- ✅ **Survives crashes** - data persists even if service stops
- ✅ **Survives redeployments** - data stays when you push new code
- ✅ **Faster for small datasets** - SQLite is optimized for single-server apps
- ✅ **No connection limits** - no database connection pool issues
- ✅ **Same safety features** - automatic JSON exports, backups, recovery tools

---

## Current Setup (Before Migration)

```
Render Service: mannameter
├── PostgreSQL Database (1GB free for 90 days, then $7/month)
│   └── Risk: Resets on crashes
├── Environment: DATABASE_URL = postgres://...
└── Data: Lives in database only
```

**Problem:** When Render crashed with 502 error, database reset to empty state

---

## New Setup (After Migration)

```
Render Service: mannameter
├── Persistent Disk (1GB, free forever)
│   ├── Mount Path: /mnt/data
│   └── Database: /mnt/data/mannameter.db (SQLite)
├── Environment: PERSISTENT_DISK_PATH = /mnt/data
├── Auto-backup: results.json.b64 (pushed to GitHub)
└── GitHub Pages: results.json (static dashboard)
```

**Benefits:**
- Data persists through crashes
- Data persists through redeployments
- Automatic JSON exports continue
- GitHub Pages stays synced
- $0/month forever

---

## Migration Steps

### Phase 1: Prepare Data (Local)

**1. Export current database:**

```bash
cd C:\Users\johnb\Documents\GitHub\b3bo.github.io\MannaMeter
python migrate_to_persistent_disk.py
```

**This will:**
- Export all videos from current database
- Save to `results.json.b64` (for auto-load on Render)
- Save to `results.json` (for GitHub Pages)
- Create migration backup in `backups/pre_migration_*.json.b64`

**2. Commit and push:**

```bash
git add .
git commit -m "Prepare for persistent disk migration"
git push origin main
```

---

### Phase 2: Configure Render (Web Dashboard)

**1. Add Persistent Disk:**

1. Go to https://dashboard.render.com/
2. Select your `mannameter` service
3. Click **"Disks"** tab (left sidebar)
4. Click **"Add Disk"** button
5. Fill in:
   - **Name:** `mannameter-data`
   - **Mount Path:** `/mnt/data`
   - **Size:** `1 GB` (free tier)
6. Click **"Create"**

**2. Add Environment Variable:**

1. Click **"Environment"** tab
2. Click **"Add Environment Variable"**
3. Fill in:
   - **Key:** `PERSISTENT_DISK_PATH`
   - **Value:** `/mnt/data`
4. Click **"Save Changes"**

**3. (Optional) Remove PostgreSQL:**

**To save $7/month after trial:**

1. In "Environment" tab
2. Find `DATABASE_URL` variable
3. Click **"Delete"**
4. Confirm deletion

**OR keep both:**
- App will prefer persistent disk if `PERSISTENT_DISK_PATH` is set
- PostgreSQL will be ignored (but you'll still be charged after trial)

**4. Deploy:**

Render will auto-deploy when you saved changes. Or manually trigger:
1. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

### Phase 3: Verify Migration

**1. Watch Render logs:**

1. Click **"Logs"** tab
2. Look for:
   ```
   ✅ Using persistent disk SQLite: /mnt/data/mannameter.db
   📖 Loaded 0 existing videos
   Database is empty - loading from results.json.b64...
   Found 2 videos in JSON backup
     Loaded: AFhG09L0LXA - ...
     Loaded: b47CJlE-ut0 - ...
   ✅ Database initialized with 2 videos
   ```

**2. Check live site:**

1. Visit https://mannameter.onrender.com/
2. Confirm videos are visible
3. Process a test video to verify everything works

**3. Verify persistence:**

1. In Render dashboard, click **"Manual Deploy"** → **"Clear build cache & deploy"**
2. This simulates a redeployment
3. After deploy completes, refresh your site
4. Videos should still be there (loaded from persistent disk)
5. **If database was empty, it auto-loads from results.json.b64**

---

## How It Works

### On Every Render Startup:

```python
# app.py checks environment variables
DATABASE_URL = os.environ.get('DATABASE_URL')  # PostgreSQL (old)
PERSISTENT_DISK_PATH = os.environ.get('PERSISTENT_DISK_PATH')  # Disk (new)

if PERSISTENT_DISK_PATH:
    # Use SQLite on persistent disk
    db_path = os.path.join(PERSISTENT_DISK_PATH, 'mannameter.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    print("✅ Using persistent disk SQLite")
```

### Auto-load from JSON if Database is Empty:

```python
# After creating tables
with app.app_context():
    db.create_all()

# Initialize from JSON backup (only if empty)
from init_database import init_database_from_json
init_database_from_json()
```

**This means:**
- First deployment: Loads data from `results.json.b64`
- Subsequent deployments: Uses existing SQLite database from disk
- If database gets corrupted: Delete disk in Render, redeploy, auto-loads from JSON

---

## Data Flow

### When You Process a Video:

```
1. main.py or app.py analyzes video
2. save_to_database() called
3. Data written to /mnt/data/mannameter.db (persistent disk)
4. Automatic export to results.json + results.json.b64
5. Git commit/push to GitHub
6. GitHub Pages updates (static dashboard)
7. Safety backup created in backups/ folder
```

### On Render Redeployment:

```
1. Render pulls latest code from GitHub
2. Starts Flask app
3. Checks PERSISTENT_DISK_PATH environment variable
4. Connects to /mnt/data/mannameter.db
5. Database still has all your videos (disk persists)
6. No data loss!
```

### On Render Crash (502 Error):

```
1. Service crashes
2. Render auto-restarts
3. Persistent disk data survives
4. Connects to /mnt/data/mannameter.db
5. All videos still there
6. No data loss!
```

### If Database Gets Corrupted:

```
1. Delete persistent disk in Render dashboard
2. Recreate disk with same mount path
3. Redeploy
4. init_database.py auto-loads from results.json.b64
5. Data restored from JSON backup
```

---

## Troubleshooting

### "Videos disappeared after migration"

**Check Render logs for:**
```
✅ Using persistent disk SQLite: /mnt/data/mannameter.db
```

**If you see:**
```
Using PostgreSQL: postgres://...
```

**Fix:**
- Verify `PERSISTENT_DISK_PATH` environment variable is set
- Value should be `/mnt/data` (exact match)
- Redeploy after setting

---

### "Database is empty after migration"

**Check if `results.json.b64` was pushed to GitHub:**

```bash
cd C:\Users\johnb\Documents\GitHub\b3bo.github.io\MannaMeter
git status
# Should show results.json.b64 is committed and pushed
```

**If missing:**
```bash
python migrate_to_persistent_disk.py
git add results.json.b64 results.json
git commit -m "Add JSON backups for auto-load"
git push origin main
```

---

### "Still getting charged for PostgreSQL"

**After 90-day trial ends:**
- Go to Render dashboard
- Click "Environment" tab
- Delete `DATABASE_URL` variable
- This removes the PostgreSQL addon
- You'll only use persistent disk (free)

---

### "How do I back up persistent disk data?"

**Automatic backups (already working):**
- Every video processing creates safety backup
- Automatic export to `results.json` (pushed to GitHub)
- Manual backups with `python backup_util.py backup`

**Disk backups are in Git:**
- `results.json.b64` contains all videos
- Pushed to GitHub on every save
- Can restore entire database from this file

**Offsite backups (recommended monthly):**
```bash
# Download backups folder
# Store on Google Drive / Dropbox
```

---

## Cost Comparison

### Current Setup (PostgreSQL):
- **First 90 days:** Free
- **After 90 days:** $7/month
- **Annual cost:** $84/year

### New Setup (Persistent Disk):
- **Forever:** $0/month
- **Annual cost:** $0/year
- **Savings:** $84/year

**For 100 videos:**
- PostgreSQL: $84/year
- Persistent Disk: $0/year

**For 1,000 videos:**
- PostgreSQL: $84/year + may need larger plan
- Persistent Disk: $0/year (1GB = ~31,000 videos)

---

## Capacity Planning

**1GB Persistent Disk can hold:**
- ~31,000 videos (based on current 35KB average)
- More than enough for 100-1,000 sermons

**Current usage:**
- 2 videos = ~70 KB
- 100 videos = ~3.5 MB
- 1,000 videos = ~35 MB
- 10,000 videos = ~350 MB

**You're using < 1% of capacity with current data**

---

## Rollback Plan

**If migration goes wrong:**

1. **Restore PostgreSQL:**
   - Add `DATABASE_URL` back in Render environment
   - Remove `PERSISTENT_DISK_PATH`
   - Redeploy

2. **Restore from backup:**
   ```bash
   python backup_util.py list
   python backup_util.py restore --index 0
   ```

3. **Emergency recovery:**
   ```python
   from data_manager import load_all_videos
   all_videos = load_all_videos()
   # Will scan database + JSON + backups + emergency saves
   ```

---

## Summary

**What you get:**
- ✅ $0/month cost (vs $7/month)
- ✅ Data survives crashes (no more 502 data loss)
- ✅ Data survives redeployments
- ✅ Same safety features (backups, auto-export, recovery)
- ✅ Faster performance for small datasets
- ✅ No connection limits

**What you need to do:**
1. Run `python migrate_to_persistent_disk.py` (local)
2. Commit and push
3. Add persistent disk in Render dashboard
4. Add `PERSISTENT_DISK_PATH=/mnt/data` environment variable
5. Optionally remove `DATABASE_URL` to stop PostgreSQL charges
6. Deploy and verify

**Time to migrate:** ~10 minutes

**Risk:** Very low (automatic JSON backups, easy rollback)

**Recommended:** Yes - free, reliable, and solves your data loss issue

---

## Next Steps

**Ready to migrate?**

```bash
cd C:\Users\johnb\Documents\GitHub\b3bo.github.io\MannaMeter
python migrate_to_persistent_disk.py
```

Follow the output instructions to configure Render.

**Questions?** Check the troubleshooting section above.
