#!/usr/bin/env python3
"""
YouTube Transcript Keyword Counter

This script reads the transcript from a YouTube video and counts occurrences of specified keywords.
"""

import argparse
import re
from collections import Counter
from youtube_transcript_api import YouTubeTranscriptApi


# List of 66 books of the Bible
BIBLE_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
    "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel",
    "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
    "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
    "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
    "Jude", "Revelation"
]


def extract_video_id(url):
    """Extract video ID from YouTube URL."""
    patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtu\.be/([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL")


def get_transcript(video_id):
    """Get transcript for the video."""
    try:
        transcript = YouTubeTranscriptApi().fetch(video_id)
        return ' '.join([entry.text for entry in transcript])
    except Exception as e:
        raise Exception(f"Could not retrieve transcript: {e}")


def count_keywords(text, keywords):
    """Count occurrences of keywords in text."""
    text_lower = text.lower()
    counts = {}
    for keyword in keywords:
        count = text_lower.count(keyword.lower())
        counts[keyword] = count
    return counts


def main():
    parser = argparse.ArgumentParser(description='Count keywords in YouTube video transcript')
    parser.add_argument('url', nargs='?', help='YouTube video URL')
    parser.add_argument('--keywords', nargs='*', help='Keywords to count (defaults to 66 books of the Bible)')
    args = parser.parse_args()

    if not args.url:
        args.url = input("Enter YouTube video URL: ").strip()

    keywords = args.keywords if args.keywords else BIBLE_BOOKS

    try:
        video_id = extract_video_id(args.url)
        print(f"Video ID: {video_id}")

        transcript = get_transcript(video_id)
        print(f"Transcript length: {len(transcript)} characters")

        counts = count_keywords(transcript, keywords)
        print("\nKeyword counts:")
        for keyword, count in counts.items():
            if count > 0:  # Only show books that appear
                print(f"{keyword}: {count}")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == '__main__':
    main()