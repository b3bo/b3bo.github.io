#!/usr/bin/env python3
"""
MannaMeter Backup Utility
Handles automated backups and restoration of sermon analysis data.
"""

import os
import shutil
import json
import base64
from datetime import datetime, timedelta
from pathlib import Path
import argparse
import sys

class MannaMeterBackup:
    def __init__(self, data_dir=".", backup_dir="backups"):
        self.data_dir = Path(data_dir)
        self.backup_dir = self.data_dir / backup_dir
        self.results_file = self.data_dir / "results.json.b64"
        self.backup_dir.mkdir(exist_ok=True)

    def create_backup(self, suffix=""):
        """Create a timestamped backup of the results file."""
        if not self.results_file.exists():
            print(f"Warning: {self.results_file} does not exist. Nothing to backup.")
            return None

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if suffix:
            backup_name = f"results_backup_{timestamp}_{suffix}.json.b64"
        else:
            backup_name = f"results_backup_{timestamp}.json.b64"

        backup_path = self.backup_dir / backup_name

        try:
            shutil.copy2(self.results_file, backup_path)
            print(f"Backup created: {backup_path}")
            return backup_path
        except Exception as e:
            print(f"Error creating backup: {e}")
            return None

    def list_backups(self):
        """List all available backups."""
        backups = list(self.backup_dir.glob("results_backup_*.json.b64"))
        backups.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        if not backups:
            print("No backups found.")
            return []

        print(f"Found {len(backups)} backups:")
        for i, backup in enumerate(backups, 1):
            mtime = datetime.fromtimestamp(backup.stat().st_mtime)
            size = backup.stat().st_size
            print(f"{i}. {backup.name} - {mtime.strftime('%Y-%m-%d %H:%M:%S')} ({size} bytes)")

        return backups

    def restore_backup(self, backup_name=None, backup_index=None):
        """Restore from a specific backup."""
        backups = self.list_backups()

        if not backups:
            print("No backups available to restore from.")
            return False

        if backup_index is not None:
            if 1 <= backup_index <= len(backups):
                selected_backup = backups[backup_index - 1]
            else:
                print(f"Invalid backup index. Must be between 1 and {len(backups)}")
                return False
        elif backup_name:
            matching_backups = [b for b in backups if backup_name in b.name]
            if matching_backups:
                selected_backup = matching_backups[0]
            else:
                print(f"No backup found with name containing '{backup_name}'")
                return False
        else:
            # Default to most recent backup
            selected_backup = backups[0]

        # Create a backup of current state before restoring
        current_backup = self.create_backup("before_restore")
        if current_backup:
            print(f"Current state backed up to: {current_backup}")

        try:
            shutil.copy2(selected_backup, self.results_file)
            print(f"Successfully restored from: {selected_backup}")
            return True
        except Exception as e:
            print(f"Error restoring backup: {e}")
            return False

    def cleanup_old_backups(self, keep_days=30, keep_count=10):
        """Clean up old backups, keeping recent ones and limiting total count."""
        backups = list(self.backup_dir.glob("results_backup_*.json.b64"))
        if not backups:
            return

        # Sort by modification time (newest first)
        backups.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        # Keep the most recent 'keep_count' backups
        to_delete = backups[keep_count:]

        # Also delete backups older than 'keep_days' days
        cutoff_date = datetime.now() - timedelta(days=keep_days)
        old_backups = [b for b in backups if datetime.fromtimestamp(b.stat().st_mtime) < cutoff_date]

        # Combine lists and remove duplicates
        to_delete.extend(old_backups)
        to_delete = list(set(to_delete))

        deleted_count = 0
        for backup in to_delete:
            try:
                backup.unlink()
                deleted_count += 1
                print(f"Deleted old backup: {backup.name}")
            except Exception as e:
                print(f"Error deleting {backup.name}: {e}")

        if deleted_count > 0:
            print(f"Cleaned up {deleted_count} old backup(s)")
        else:
            print("No old backups to clean up")

    def get_backup_stats(self):
        """Get statistics about backups."""
        backups = list(self.backup_dir.glob("results_backup_*.json.b64"))

        if not backups:
            print("No backups found.")
            return

        total_size = sum(b.stat().st_size for b in backups)
        oldest = min(backups, key=lambda x: x.stat().st_mtime)
        newest = max(backups, key=lambda x: x.stat().st_mtime)

        print(f"Backup Statistics:")
        print(f"  Total backups: {len(backups)}")
        print(f"  Total size: {total_size:,} bytes ({total_size/1024/1024:.2f} MB)")
        print(f"  Oldest: {oldest.name} ({datetime.fromtimestamp(oldest.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')})")
        print(f"  Newest: {newest.name} ({datetime.fromtimestamp(newest.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')})")

    def verify_backup(self, backup_path):
        """Verify that a backup file is valid."""
        try:
            with open(backup_path, 'r') as f:
                encoded_data = f.read()

            decoded_data = base64.b64decode(encoded_data).decode()
            data = json.loads(decoded_data)

            video_count = len(data)
            print(f"✅ Backup {backup_path.name} is valid - contains {video_count} video(s)")
            return True

        except Exception as e:
            print(f"❌ Backup {backup_path.name} is corrupted: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(description="MannaMeter Backup Utility")
    parser.add_argument("--data-dir", default=".", help="Directory containing results.json.b64")
    parser.add_argument("--backup-dir", default="backups", help="Directory to store backups")

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Backup command
    subparsers.add_parser("backup", help="Create a new backup")

    # List command
    subparsers.add_parser("list", help="List all backups")

    # Restore command
    restore_parser = subparsers.add_parser("restore", help="Restore from backup")
    restore_parser.add_argument("--name", help="Backup name (partial match)")
    restore_parser.add_argument("--index", type=int, help="Backup index from list")

    # Cleanup command
    cleanup_parser = subparsers.add_parser("cleanup", help="Clean up old backups")
    cleanup_parser.add_argument("--keep-days", type=int, default=30, help="Keep backups newer than this many days")
    cleanup_parser.add_argument("--keep-count", type=int, default=10, help="Keep this many most recent backups")

    # Stats command
    subparsers.add_parser("stats", help="Show backup statistics")

    # Verify command
    verify_parser = subparsers.add_parser("verify", help="Verify backup integrity")
    verify_parser.add_argument("--name", help="Backup name to verify")
    verify_parser.add_argument("--all", action="store_true", help="Verify all backups")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    backup_util = MannaMeterBackup(args.data_dir, args.backup_dir)

    if args.command == "backup":
        backup_util.create_backup()

    elif args.command == "list":
        backup_util.list_backups()

    elif args.command == "restore":
        backup_util.restore_backup(args.name, args.index)

    elif args.command == "cleanup":
        backup_util.cleanup_old_backups(args.keep_days, args.keep_count)

    elif args.command == "stats":
        backup_util.get_backup_stats()

    elif args.command == "verify":
        if args.all:
            backups = backup_util.list_backups()
            valid_count = 0
            for backup in backups:
                if backup_util.verify_backup(backup):
                    valid_count += 1
            print(f"\nSummary: {valid_count}/{len(backups)} backups are valid")
        elif args.name:
            backups = list(backup_util.backup_dir.glob(f"*{args.name}*.json.b64"))
            if backups:
                backup_util.verify_backup(backups[0])
            else:
                print(f"No backup found with name containing '{args.name}'")
        else:
            print("Specify --name or --all for verification")


if __name__ == "__main__":
    main()