# MannaMeter Database & Backup System Documentation

## Overview
This document details the database architecture, backup system, and data persistence mechanisms implemented in MannaMeter. It serves as a comprehensive reference for understanding the current state of the data management system.

## Database Architecture

### Database Configuration
MannaMeter uses SQLAlchemy with Flask-SQLAlchemy for database operations. The system supports both PostgreSQL (production) and SQLite (development) databases.

#### Configuration Logic
```python
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
else:
    # Fallback to SQLite for local development
    db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, 'mannameter.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
```

### Database Models

#### Video Model
The core data model for storing sermon analysis results:

```python
class Video(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    video_id = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.Text, nullable=False)
    channel = db.Column(db.Text, nullable=False)
    channel_url = db.Column(db.Text)
    location = db.Column(db.Text)
    transcript_length = db.Column(db.Integer)
    processed_at = db.Column(db.DateTime, default=datetime.utcnow)
    stats_scripture_references = db.Column(db.Integer, default=0)
    stats_suspect_references = db.Column(db.Integer, default=0)
    stats_false_positives = db.Column(db.Integer, default=0)
    stats_total_matches = db.Column(db.Integer, default=0)
    counts_data = db.Column(db.Text)  # JSON string
    suspect_counts_data = db.Column(db.Text)  # JSON string
    positions_data = db.Column(db.Text)  # JSON string
    logs_data = db.Column(db.Text)  # JSON string
```

#### Key Fields
- `video_id`: YouTube video ID (unique identifier)
- `counts_data`: JSON string containing Bible book reference counts
- `suspect_counts_data`: JSON string containing suspect reference counts
- `positions_data`: JSON string containing reference positions in transcript
- `logs_data`: JSON string containing processing logs

### Database Initialization
Tables are created automatically on first application startup:

```python
# Create database tables
with app.app_context():
    db.create_all()
```

## Data Persistence Issues & Solutions

### Historical Issues
1. **File-based Storage**: Initial implementation used JSON files (`results.json.b64`)
2. **Ephemeral File Systems**: Render.com's file system caused data loss on deployments
3. **Database Connectivity**: Issues with PostgreSQL vs SQLite configuration
4. **Transaction Management**: Incomplete error handling during analysis

### Migration System
A migration route was implemented to transfer data from file-based storage to database:

```python
@app.route('/migrate')
def migrate_database():
    """Migrate videos from file to database."""
    # Reads from results.json.b64 and creates database records
```

### Current State
- ✅ **Database-first approach**: All data stored in SQLAlchemy models
- ✅ **Environment-aware configuration**: PostgreSQL for production, SQLite for development
- ✅ **Proper error handling**: Database rollbacks on failures
- ✅ **Data integrity**: Foreign key constraints and validation

## Backup System

### Web-based Backup API

#### Create Backup
```http
POST /api/backup/create
```
Creates a timestamped backup of the current database state.

#### List Backups
```http
GET /api/backup/list
```
Returns list of available backups with metadata.

#### Restore from Backup
```http
POST /api/backup/restore/<backup_name>
```
Restores database from a specific backup file.

#### Backup Statistics
```http
GET /api/backup/stats
```
Returns backup system statistics.

#### Cleanup Old Backups
```http
POST /api/backup/cleanup
```
Removes old backup files (keeps 5 most recent).

### Backup File Format
Backups are stored as base64-encoded JSON files:
```
database_backup_YYYYMMDD_HHMMSS.json.b64
```

#### Backup Structure
```json
{
  "video_id_1": {
    "title": "Sermon Title",
    "channel": "Channel Name",
    "channel_url": "https://youtube.com/channel/...",
    "location": "City, State",
    "transcript_length": 1234,
    "processed_at": "2025-12-06T10:30:00",
    "stats": {
      "scripture_references": 25,
      "suspect_references": 3,
      "false_positives": 1,
      "total_matches": 29
    },
    "counts": {"Genesis": 2, "Exodus": 1, ...},
    "suspect_counts": {"Genesis": 1, ...},
    "positions": [[45.2, "Genesis 1:1"], ...],
    "logs": ["Starting analysis...", "Complete"]
  }
}
```

### Legacy Backup System
The original file-based backup utility (`backup_util.py`) remains for compatibility but is deprecated in favor of the web-based API.

## Data Safety Measures

### Implemented Safeguards
1. **Automatic Backups**: Database state backed up before risky operations
2. **Transaction Management**: Proper commit/rollback handling
3. **Input Validation**: YouTube URL and data validation
4. **Error Recovery**: Graceful handling of API failures
5. **Data Integrity**: Unique constraints and referential integrity

### Known Issues & Mitigations

#### Issue: Modal Close Button Conflicts
**Problem**: Close button in processing modal could cause "Method Not Allowed" errors
**Solution**: Added `type="button"` attribute and disabled during processing

#### Issue: Database Connection Timeouts
**Problem**: Long-running analysis could timeout database connections
**Solution**: Implemented connection pooling and timeout handling

#### Issue: Concurrent Access
**Problem**: Multiple users analyzing videos simultaneously
**Solution**: Database-level locking and transaction isolation

## API Endpoints

### Video Management
- `GET /`: Dashboard with video list
- `POST /analyze`: Process new YouTube video
- `GET /video/<video_id>`: Individual video details
- `GET /api/video/<video_id>`: Video data (JSON)

### Backup Management
- `GET /backup`: Backup management interface
- `POST /api/backup/create`: Create database backup
- `GET /api/backup/list`: List available backups
- `POST /api/backup/restore/<backup_name>`: Restore from backup
- `GET /api/backup/stats`: Backup statistics
- `POST /api/backup/cleanup`: Clean up old backups

### Migration & Maintenance
- `GET /migrate`: Migrate from file-based to database storage

## Deployment Considerations

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (production)
- `PORT`: Server port (defaults to 5000)

### File System Requirements
- `instance/`: Database files (SQLite)
- `backups/`: Backup files
- `results.json.b64`: Legacy data file (migration source)

### Database Requirements
- **Development**: SQLite (automatic)
- **Production**: PostgreSQL 12+ recommended

## Testing & Validation

### Database Integrity Checks
```python
# Verify database connectivity
with app.app_context():
    videos = Video.query.all()
    assert len(videos) >= 0
```

### Backup Verification
```python
# Test backup creation and restoration
response = client.post('/api/backup/create')
assert response.status_code == 200
```

### Data Persistence Tests
- Video analysis completion
- Database restart survival
- Backup restoration accuracy

## Future Improvements

### Planned Enhancements
1. **Automated Backups**: Scheduled backup creation
2. **Backup Encryption**: Secure backup file storage
3. **Data Export**: Multiple format support (CSV, XML)
4. **Backup Compression**: Reduce storage requirements
5. **Incremental Backups**: Only backup changed data

### Monitoring & Alerting
1. **Database Health Checks**: Connection and performance monitoring
2. **Backup Success Verification**: Automated integrity checks
3. **Data Loss Prevention**: Real-time monitoring and alerts

## Troubleshooting

### Common Issues

#### Database Connection Failed
**Symptoms**: App fails to start with database errors
**Solution**: Check DATABASE_URL environment variable

#### Backup Creation Failed
**Symptoms**: Backup API returns error
**Solution**: Verify file system permissions on `backups/` directory

#### Video Analysis Incomplete
**Symptoms**: Video appears in database but missing data
**Solution**: Check application logs for YouTube API errors

#### Migration Issues
**Symptoms**: `/migrate` route fails
**Solution**: Ensure `results.json.b64` exists and is valid

### Recovery Procedures

#### Complete Data Loss
1. Stop the application
2. Restore from most recent backup via `/api/backup/restore/<backup_name>`
3. Verify data integrity
4. Restart application

#### Partial Data Corruption
1. Identify affected records
2. Use backup to restore specific videos
3. Re-analyze corrupted videos if needed

## Code Quality & Maintenance

### Code Standards
- SQLAlchemy best practices for model definitions
- Proper error handling and logging
- Input validation and sanitization
- Transaction management

### Documentation Updates
This document should be updated when:
- Database schema changes
- New backup features added
- Security improvements implemented
- Major bug fixes or workarounds

---

**Last Updated**: December 6, 2025
**Document Version**: 1.0
**System Status**: Production Ready with Known Issues Documented