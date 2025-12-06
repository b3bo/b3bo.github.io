# MannaMeter Backup Guide

## Overview
MannaMeter includes a comprehensive backup system to protect your sermon analysis data. This guide explains how to use the backup features to prevent data loss.

## Quick Start

### Creating a Backup
```bash
cd MannaMeter
python backup_util.py backup
```

### Listing Backups
```bash
python backup_util.py list
```

### Restoring from Backup
```bash
python backup_util.py restore
```

## Command Reference

### CLI Commands

#### `python backup_util.py backup`
Creates a timestamped backup of your current data.
- **Location**: `backups/results_backup_YYYYMMDD_HHMMSS.json.b64`
- **Automatic**: Includes all current sermon analysis data

#### `python backup_util.py list`
Shows all available backups with timestamps and file sizes.

#### `python backup_util.py restore`
Restores from the most recent backup.
- **Safety**: Automatically creates a backup of current state before restoring
- **Confirmation**: Use `--index N` to restore from a specific backup

#### `python backup_util.py cleanup`
Removes old backups to save disk space.
- **Default**: Keeps last 10 backups, deletes backups older than 30 days
- **Configurable**: Use `--keep-days` and `--keep-count` options

#### `python backup_util.py stats`
Shows backup statistics including total size and date ranges.

#### `python backup_util.py verify`
Checks backup file integrity.
- **All backups**: `python backup_util.py verify --all`
- **Specific backup**: `python backup_util.py verify --name "backup_name"`

### Advanced Options

#### Restore Specific Backup
```bash
# Restore by index (from list command)
python backup_util.py restore --index 2

# Restore by partial name match
python backup_util.py restore --name "20251205"
```

#### Custom Cleanup
```bash
# Keep more backups
python backup_util.py cleanup --keep-count 20

# Keep backups longer
python backup_util.py cleanup --keep-days 90
```

## Web Interface

### Accessing Backup Management
1. Start MannaMeter: `python app.py`
2. Navigate to: `http://localhost:5000/backup`
3. Use the web interface to:
   - Create new backups
   - View backup list
   - Restore from backups
   - View backup statistics

### API Endpoints

#### Create Backup
```
POST /api/backup/create
Response: {"success": true, "message": "Backup created: filename"}
```

#### List Backups
```
GET /api/backup/list
Response: {"success": true, "backups": [...]}
```

#### Restore Backup
```
POST /api/backup/restore/{backup_name}
Response: {"success": true, "message": "Restored from backup"}
```

#### Get Statistics
```
GET /api/backup/stats
Response: {"success": true, "stats": {...}}
```

## Best Practices

### Regular Backups
- Create backups before major changes
- Set up automated backup scripts if needed
- Keep at least 5-10 recent backups

### Storage
- Backups are stored in the `backups/` directory
- Each backup is ~50-100KB depending on data size
- Monitor disk space usage

### Recovery
- Always test restore functionality
- Keep backups in multiple locations if critical
- Verify backup integrity regularly

## Troubleshooting

### "No backups found"
- Check that `backups/` directory exists
- Ensure you've created at least one backup
- Verify file permissions

### "Backup corrupted"
- Use `verify` command to check integrity
- Restore from a different backup
- Check available disk space

### Permission Errors
- Ensure write access to `backups/` directory
- Check file system permissions
- Run as appropriate user

## Security Notes

- Backup files contain the same base64-encoded data as your main database
- Store backups securely if containing sensitive information
- Consider encryption for offsite backups
- The `/rebuild` route deletes all data - use backups to recover

## File Structure
```
MannaMeter/
├── results.json.b64          # Main data file
├── backups/                  # Backup directory
│   ├── results_backup_20251205_143022.json.b64
│   ├── results_backup_20251205_150000.json.b64
│   └── ...
└── backup_util.py           # Backup utility script
```</content>
<parameter name="filePath">c:\Users\johnb\Documents\GitHub\b3bo.github.io\MannaMeter\docs\BACKUP_GUIDE.md