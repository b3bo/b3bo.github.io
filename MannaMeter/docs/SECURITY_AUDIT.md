# MannaMeter Security Audit - Data Loss Vulnerabilities

**Audit Date:** December 6, 2025
**Auditor:** Claude (AI Assistant)
**Scope:** Identify code that could wipe data during deployment or operation

---

## Summary

**GOOD NEWS:** No critical data-wiping vulnerabilities found that would trigger automatically on deployment.

**Findings:**
- ✅ No `db.drop_all()` calls anywhere
- ✅ `db.create_all()` is safe (only creates if not exists, doesn't delete data)
- ✅ main.py properly loads existing data before writing
- ⚠️ One dangerous route exists but requires manual trigger

---

## Detailed Findings

### ✅ SAFE: Database Initialization (app.py:71)

**Code:**
```python
with app.app_context():
    db.create_all()
```

**Analysis:**
- `db.create_all()` only creates tables if they don't exist
- Does NOT drop existing tables
- Does NOT delete existing data
- Runs on every deployment (safe)

**Risk Level:** None
**Action Required:** None

---

### ✅ SAFE: JSON File Writes (main.py:590-628)

**Code:**
```python
if os.path.exists(results_file + '.b64'):
    # Load from base64 file
    with open(results_file + '.b64', 'r') as f:
        encoded_data = f.read()
    decoded_data = base64.b64decode(encoded_data).decode()
    all_results = json.loads(decoded_data)
else:
    all_results = {}

# Add new video
all_results[video_id] = video_data

# Write updated data
with open(results_file + '.b64', 'w') as f:
    f.write(encoded_data)
```

**Analysis:**
- **Loads existing data first** (lines 590-596)
- Merges new video into existing dictionary
- Only then writes back to file
- **This is the correct pattern**

**Risk Level:** None (properly implemented)
**Action Required:** None

**However, there IS a subtle risk:**
If the file read fails (corrupted file, encoding error), it falls back to `all_results = {}`, which would create an empty dict and overwrite all data on next write.

**Recommendation:** Add error handling and backup before write.

---

### ⚠️ MODERATE RISK: Restore Route (app.py:554-597)

**Code:**
```python
@app.route('/api/backup/restore/<backup_name>', methods=['POST'])
def restore_backup(backup_name):
    # ... load backup ...

    # Clear existing data
    Video.query.delete()  # ⚠️ DELETES ALL DATA

    # Restore videos from backup
    for video_id, video_data in backup_data.items():
        new_video = Video(...)
        db.session.add(new_video)

    db.session.commit()
```

**Analysis:**
- **This route DELETES ALL DATABASE DATA** (line 570)
- Only accessible via POST request to `/api/backup/restore/<backup_name>`
- Requires backup file name as parameter
- Does NOT run automatically on deployment
- **Manual trigger only**

**Risk Level:** Moderate
**Trigger:** Manual API call or web interface button click
**Likelihood:** Low (requires intentional action)

**Mitigations Already in Place:**
- ✅ Requires POST request (not triggered by page load)
- ✅ Requires specific backup filename
- ✅ Has rollback on failure
- ✅ Should only be used via backup UI

**Recommendation:** Add confirmation prompt and safety backup before restore.

---

## Potential Data Loss Scenarios

### Scenario 1: Corrupted JSON File
**Trigger:** results.json.b64 gets corrupted (disk error, bad deploy)
**Current Behavior:**
```python
decoded_data = base64.b64decode(encoded_data).decode()  # Could throw exception
all_results = json.loads(decoded_data)  # Could throw exception
# Falls back to: all_results = {}  # ⚠️ EMPTY DICT
```

**Impact:** If exception occurs during load, next write would wipe all JSON data
**Probability:** Low (but possible with bad deploy or disk error)
**Fix:** Add try/except with backup restoration

---

### Scenario 2: Database Transaction Failure
**Trigger:** Database write fails mid-transaction
**Current Behavior:** No database writes in main.py (writes to JSON only)
**Impact:** Partial write could corrupt JSON file
**Probability:** Low
**Fix:** Use database with ACID transactions instead of JSON

---

### Scenario 3: Concurrent Writes
**Trigger:** Two processes write to JSON file simultaneously
**Current Behavior:** Last write wins, could lose data from first write
**Impact:** Data loss from race condition
**Probability:** Low (single-user app, but possible with web + CLI)
**Fix:** Use database with proper locking, or file-based locking

---

### Scenario 4: Accidental Restore Click
**Trigger:** User clicks "Restore from Backup" by mistake
**Current Behavior:** Deletes all database data, restores from backup
**Impact:** Loses any data added since that backup was created
**Probability:** Low (manual action required)
**Fix:** Add confirmation dialog and safety backup

---

## Recommendations

### Priority 1: CRITICAL (Prevent Data Loss on JSON Corruption)

**Add safety wrapper to main.py JSON write:**

```python
def safe_save_to_json(video_data, results_file):
    """Save video data with safety backups"""
    import shutil
    from datetime import datetime

    # 1. Create backup of current file BEFORE any changes
    if os.path.exists(results_file + '.b64'):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = f"backups/pre_write_{timestamp}.json.b64"
        os.makedirs('backups', exist_ok=True)
        shutil.copy2(results_file + '.b64', backup_file)
        print(f"🔒 Safety backup created: {backup_file}")

    # 2. Load existing data with error handling
    all_results = {}
    try:
        if os.path.exists(results_file + '.b64'):
            with open(results_file + '.b64', 'r') as f:
                encoded_data = f.read()
            decoded_data = base64.b64decode(encoded_data).decode()
            all_results = json.loads(decoded_data)
    except Exception as e:
        print(f"⚠️  ERROR loading existing data: {e}")
        print(f"🚨 Attempting to restore from latest backup...")
        # Try to restore from latest backup
        backups = sorted(Path('backups').glob('*.json.b64'),
                        key=lambda x: x.stat().st_mtime,
                        reverse=True)
        if backups:
            try:
                with open(backups[0], 'r') as f:
                    all_results = json.loads(base64.b64decode(f.read()).decode())
                print(f"✅ Restored from backup: {backups[0].name}")
            except:
                print(f"❌ Backup restore failed - starting with empty data")
                all_results = {}

    # 3. Add new video
    all_results[video_data['video_id']] = video_data

    # 4. Write to temporary file first
    temp_file = results_file + '.b64.tmp'
    encoded_data = base64.b64encode(
        json.dumps(all_results, separators=(',', ':')).encode()
    ).decode()

    with open(temp_file, 'w') as f:
        f.write(encoded_data)

    # 5. Verify write succeeded
    with open(temp_file, 'r') as f:
        verify_data = json.loads(base64.b64decode(f.read()).decode())

    if video_data['video_id'] not in verify_data:
        raise Exception("Write verification failed!")

    # 6. Atomic rename (on POSIX) or replace
    if os.name == 'posix':
        os.rename(temp_file, results_file + '.b64')
    else:
        # Windows: remove old, rename new
        if os.path.exists(results_file + '.b64'):
            os.remove(results_file + '.b64')
        os.rename(temp_file, results_file + '.b64')

    print(f"✅ Video saved with verification: {video_data['video_id']}")
    return True
```

---

### Priority 2: HIGH (Add Confirmation to Restore Route)

**Update app.py restore route:**

```python
@app.route('/api/backup/restore/<backup_name>', methods=['POST'])
def restore_backup(backup_name):
    """Restore from a specific database backup."""
    try:
        # SAFETY: Create backup of current state BEFORE restore
        print("Creating safety backup before restore...")
        current_videos = Video.query.all()
        current_data = {v.video_id: v.to_dict() for v in current_videos}

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safety_backup = f"database_backup_before_restore_{timestamp}.json.b64"
        safety_path = os.path.join(SCRIPT_DIR, 'backups', safety_backup)

        encoded = base64.b64encode(
            json.dumps(current_data, separators=(',', ':')).encode()
        ).decode()

        with open(safety_path, 'w') as f:
            f.write(encoded)

        print(f"Safety backup created: {safety_backup}")

        # ... rest of restore code ...
```

---

### Priority 3: MEDIUM (Switch to Database for Writes)

See `DATA_ARCHITECTURE_PLAN.md` for full implementation plan.

---

## Deployment Checklist

Before every deploy to Render.com:

- [ ] Create manual backup: `python backup_util.py backup`
- [ ] Verify backup: `python backup_util.py verify --name <backup_name>`
- [ ] Check database connection: `python -c "from app import app, Video; app.app_context().push(); print(Video.query.count())"`
- [ ] Commit changes to GitHub
- [ ] Monitor Render.com deployment logs
- [ ] After deploy, verify data: Check video count in web UI

---

## Conclusion

**Overall Risk Level:** LOW

The current codebase does NOT have any automatic data-wiping code that runs on deployment. The main risks are:

1. **JSON file corruption** (low probability, high impact) → Fix with safe write wrapper
2. **Accidental restore** (low probability, medium impact) → Fix with confirmation
3. **Race conditions** (very low probability) → Fix with database migration

**Next Steps:** Implement Priority 1 fix (safe JSON write) as part of Phase 1 implementation.
