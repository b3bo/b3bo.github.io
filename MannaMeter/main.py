#!/usr/bin/env python3
"""
YouTube Transcript Keyword Counter

This script reads the transcript from a YouTube video and counts occurrences of specified keywords.
"""

import argparse
import re
from collections import Counter
from youtube_transcript_api import YouTubeTranscriptApi
import requests
from datetime import datetime
import os
import random


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

# Bible book chapters for validation
BOOK_CHAPTERS = {
    "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
    "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
    "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
    "Ezra": 10, "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150,
    "Proverbs": 31, "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66,
    "Jeremiah": 52, "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14,
    "Joel": 3, "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3,
    "Habakkuk": 3, "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
    "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28,
    "Romans": 16, "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6,
    "Ephesians": 6, "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5,
    "2 Thessalonians": 3, "1 Timothy": 6, "2 Timothy": 4, "Titus": 3, "Philemon": 1,
    "Hebrews": 13, "James": 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5,
    "2 John": 1, "3 John": 1, "Jude": 1, "Revelation": 22
}


def extract_video_id(url):
    """Extract video ID from YouTube URL."""
    # Check if it's already a video ID
    if len(url) == 11 and re.match(r'[a-zA-Z0-9_-]{11}', url):
        return url
    
    patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtu\.be/([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtube\.com/live/([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL")


def get_video_info(video_id):
    """Get video title and channel name from YouTube page."""
    url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = response.text
        
        # Extract title
        title_match = re.search(r'<title>([^<]+)</title>', html)
        title = title_match.group(1).replace(' - YouTube', '').strip() if title_match else 'Unknown Title'
        
        # Extract channel name (from meta tag or link)
        channel_match = re.search(r'"author":"([^"]+)"', html)
        if not channel_match:
            channel_match = re.search(r'<link itemprop="name" content="([^"]+)">', html)
        channel = channel_match.group(1).strip() if channel_match else 'Unknown Channel'
        
        # Extract channel URL
        channel_id_match = re.search(r'"channelId":"([^"]+)"', html)
        channel_url = f"https://www.youtube.com/channel/{channel_id_match.group(1)}" if channel_id_match else ""
        
        return title, channel, channel_url
    except Exception as e:
        return 'Unknown Title', 'Unknown Channel', ''


def get_channel_location(channel_url):
    """Get channel location from YouTube about page."""
    if not channel_url:
        return ""
    about_url = channel_url + "/about"
    try:
        response = requests.get(about_url, headers={'User-Agent': 'Mozilla/5.0'})
        html = response.text
        # Extract location
        location_match = re.search(r'<td[^>]*>Location</td>\s*<td[^>]*>([^<]+)</td>', html, re.IGNORECASE)
        if location_match:
            return location_match.group(1).strip()
        else:
            return ""
    except Exception as e:
        return ""


def get_channel_description(channel_url):
    """Get channel description from YouTube about page."""
    if not channel_url:
        return ""
    about_url = channel_url + "/about"
    try:
        response = requests.get(about_url, headers={'User-Agent': 'Mozilla/5.0'})
        html = response.text
        # Extract description from meta tag
        description_match = re.search(r'"description":"([^"]+)"', html)
        if description_match:
            return description_match.group(1).strip()
        else:
            return ""
    except Exception as e:
        return ""


def validate_channel_is_sermon(channel_url):
    """Check if channel description contains church/Christ/Jesus keywords."""
    description = get_channel_description(channel_url)
    keywords = ["church", "christ", "jesus"]
    
    # Case-insensitive check
    description_lower = description.lower()
    for keyword in keywords:
        if keyword in description_lower:
            return True, description
    
    return False, description


def get_transcript(video_id):
    """Get transcript for the video."""
    proxy_list = os.getenv('PROXY_LIST', '').split(',') if os.getenv('PROXY_LIST') else []
    tried_proxies = []
    logs = []
    
    for proxy_url in proxy_list:
        proxy_url = proxy_url.strip()
        if not proxy_url:
            continue
        proxies = {
            'http': proxy_url,
            'https': proxy_url
        }
        logs.append(f"Trying proxy: {proxy_url}")
        print(f"Trying proxy: {proxy_url}")  # Log which proxy is being tried
        try:
            transcript_snippets = YouTubeTranscriptApi().get_transcript(video_id, proxies=proxies)
            transcript_text = ' '.join([entry['text'] for entry in transcript_snippets])
            logs.append(f"Success with proxy: {proxy_url}")
            return transcript_text, transcript_snippets, logs
        except Exception as e:
            tried_proxies.append(proxy_url)
            logs.append(f"Proxy {proxy_url} failed: {e}")
            print(f"Proxy {proxy_url} failed: {e}")
            continue
    
    # If all proxies failed
    error_msg = "Could not retrieve transcript after trying all proxies."
    if tried_proxies:
        error_msg += f" Tried proxies: {', '.join(tried_proxies)}"
    logs.append(f"Transcript retrieval failed: {error_msg}")
    print(f"Transcript retrieval failed: {error_msg}")
    return None, None, logs


def count_keywords(transcript_text, keywords, transcript_snippets):
    """Count occurrences of keywords in text and collect positions with validation."""
    text_lower = transcript_text.lower()
    counts = {}
    suspect_counts = {}
    positions = {}
    stats = {
        'total_matches': 0,
        'capitalized_matches': 0,
        'scripture_references': 0,
        'suspect_references': 0,
        'false_positives': 0,
        'not_counted': 0
    }
    
    # Scripture reference patterns (case insensitive)
    # Create case-insensitive version of Bible books for pattern matching
    books_pattern = '|'.join(BIBLE_BOOKS).lower()
    
    scripture_patterns = [
        r'book of\s+',
        r'chapter\s+\d+',
        r'verse\s+\d+',
        r'\s*\d+:\d+',
        r'\s*\d+\s+\d+',
        r'\s*\d+:\d+-\d+',
        r'\s*\d+\s+\d+-\d+',
        r'in (?=' + books_pattern + r')',
        r'\s+says',
        r'\s+teaches',
        r'\s+tells',
        r'according to\s+',
        r'\s+scripture',
        r'\s+bible',
        r'\s+gospel',
        r'\s+writes',
        r'says in\s+'
    ]
    
    for keyword in keywords:
        pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
        
        positions[keyword] = {
            'valid': [],
            'suspect': [],
            'false_positive': [],
            'not_counted': []
        }
        
        scripture_count = 0
        suspect_count = 0
        
        for match_obj in re.finditer(pattern, text_lower):
            pos = match_obj.start()
            stats['total_matches'] += 1
            
            # Check capitalization
            actual_word = transcript_text[pos:pos + len(keyword)]
            is_capitalized = actual_word == keyword
            
            if is_capitalized:
                stats['capitalized_matches'] += 1
            
            # Check for scripture context
            context_start = max(0, pos - 150)
            context_end = min(len(transcript_text), pos + len(keyword) + 150)
            context = transcript_text[context_start:context_end].lower()
            context_original = transcript_text[context_start:context_end]
            keyword_relative = pos - context_start
            
            has_scripture_pattern = False
            matched_pattern = None
            matched_text = None
            
            # Find the pattern match closest to the book name, with priority for verse references
            closest_distance = float('inf')
            closest_match = None
            closest_pattern = None
            
            # Define pattern priorities (higher number = higher priority)
            pattern_priorities = {
                r'\s*\d+:\d+': 10,  # Verse references like "10:3" get highest priority
                r'\s*\d+:\d+-\d+': 9,
                r'\s*\d+\s+\d+': 8,
                r'\s*\d+\s+\d+-\d+': 7,
                r'chapter\s+\d+': 6,
                r'verse\s+\d+': 5,
                r'book of\s+': 4,
                r'\s+gospel': 3,
                r'\s+scripture': 3,
                r'\s+bible': 3,
                r'according to\s+': 2,
                r'says in\s+': 2,
                r'\s+writes': 2,
                r'\s+says': 1,
                r'\s+teaches': 1,
                r'\s+tells': 1,
                r'in (?=' + books_pattern + r')': 0,  # Generic "in" gets lowest priority
            }
            
            for pattern_part in scripture_patterns:
                for match_obj in re.finditer(pattern_part, context):
                    pattern_start = match_obj.start()
                    distance = abs(keyword_relative - pattern_start)
                    if distance <= 50:
                        priority = pattern_priorities.get(pattern_part, 0)
                        # Use priority as primary sort, then distance as secondary
                        priority_score = (priority * 1000) - distance  # Higher priority wins, then closer distance
                        
                        if priority_score > (pattern_priorities.get(closest_pattern, 0) * 1000 - closest_distance if closest_pattern else float('-inf')):
                            closest_distance = distance
                            closest_match = match_obj
                            closest_pattern = pattern_part
            
            if closest_match:
                has_scripture_pattern = True
                matched_pattern = closest_pattern
                # Extract matched text from original context and strip whitespace for clean underline
                matched_text = context_original[closest_match.start():closest_match.end()].strip()
            
            # Additional check: valid chapter reference
            if not has_scripture_pattern:
                chapter_match = re.search(r'\b' + re.escape(keyword.lower()) + r'\s+(\d+)', context)
                if chapter_match:
                    chapter_num = int(chapter_match.group(1))
                    if keyword in BOOK_CHAPTERS and 1 <= chapter_num <= BOOK_CHAPTERS[keyword]:
                        has_scripture_pattern = True
                        matched_pattern = 'chapter_number'
                        # Get the actual text from original case context
                        chapter_match_original = re.search(r'\b' + re.escape(keyword) + r'\s+(\d+)', context_original, re.IGNORECASE)
                        if chapter_match_original:
                            matched_text = chapter_match_original.group(0)
            
            # Find snippet for position
            cumulative_len = 0
            snippet_info = None
            for snippet in transcript_snippets:
                snippet_len = len(snippet.text)
                if cumulative_len + snippet_len > pos:
                    snippet_info = {
                        'start': snippet.start,
                        'context': f"...{transcript_text[context_start:context_end]}...",
                        'text': snippet.text,
                        'matched_pattern': matched_text if matched_text else ''
                    }
                    break
                cumulative_len += snippet_len
            
            if is_capitalized and has_scripture_pattern:
                scripture_count += 1
                stats['scripture_references'] += 1
                positions[keyword]['valid'].append(snippet_info)
            elif not is_capitalized and has_scripture_pattern:
                suspect_count += 1
                stats['suspect_references'] += 1
                positions[keyword]['suspect'].append(snippet_info)
            elif is_capitalized and not has_scripture_pattern:
                stats['false_positives'] += 1
                positions[keyword]['false_positive'].append(snippet_info)
            else:  # not capitalized, no context
                stats['not_counted'] += 1
                positions[keyword]['not_counted'].append(snippet_info)
        
        counts[keyword] = scripture_count
        suspect_counts[keyword] = suspect_count
    
    return counts, suspect_counts, positions, stats


def main():
    parser = argparse.ArgumentParser(description='Count keywords in YouTube video transcript')
    parser.add_argument('url', nargs='?', help='YouTube video URL')
    parser.add_argument('--keywords', nargs='*', help='Keywords to count (defaults to 66 books of the Bible)')
    parser.add_argument('--web', action='store_true', help='Run web interface instead of CLI')
    args = parser.parse_args()

    if args.web:
        from app import app
        print("Starting web interface on http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
        return

    if not args.url:
        args.url = input("Enter YouTube video URL: ").strip()

    keywords = args.keywords if args.keywords else BIBLE_BOOKS

    try:
        video_id = extract_video_id(args.url)
        print(f"Video ID: {video_id}")

        title, channel, channel_url = get_video_info(video_id)
        location = get_channel_location(channel_url)
        print(f"Title: {title}")
        print(f"Channel: {channel}")
        print(f"Location: {location}")

        transcript_text, transcript_snippets = get_transcript(video_id)
        print(f"Transcript length: {len(transcript_text)} characters")

        counts, suspect_counts, positions, stats = count_keywords(transcript_text, keywords, transcript_snippets)
        
        # Save results to JSON
        import json
        import os
        results_file = 'results.json'
        if os.path.exists(results_file):
            with open(results_file, 'r') as f:
                all_results = json.load(f)
        else:
            all_results = {}
        
        # Prepare counts for all 66 books
        full_counts = {book: counts.get(book, 0) for book in BIBLE_BOOKS}
        full_suspect_counts = {book: suspect_counts.get(book, 0) for book in BIBLE_BOOKS}
        
        video_data = {
            'video_id': video_id,
            'title': title,
            'channel': channel,
            'channel_url': channel_url,
            'location': location,
            'transcript_length': len(transcript_text),
            'processed_at': str(datetime.now()),
            'stats': stats,
            'counts': full_counts,
            'suspect_counts': full_suspect_counts,
            'positions': positions
        }
        
        all_results[video_id] = video_data
        
        with open(results_file, 'w') as f:
            json.dump(all_results, f, indent=2)
        
        print(f"Results saved to {results_file}")
        
        print("\nScripture Reference Analysis:")
        print(f"Total word matches: {stats['total_matches']}")
        print(f"Capitalized matches: {stats['capitalized_matches']}")
        print(f"Confirmed scripture references: {stats['scripture_references']}")
        print(f"Suspect scripture references (not capitalized but context): {stats['suspect_references']}")
        print(f"False positives (capitalized but no context): {stats['false_positives']}")
        print(f"Not counted (no context): {stats['not_counted']}")
        
        print("\nConfirmed Scripture references (sorted by frequency):")
        for keyword, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                suspect = suspect_counts.get(keyword, 0)
                total = count + suspect
                print(f"{keyword}: {count} confirmed (+ {suspect} suspect = {total} total)")

        # Show examples
        print("\nExamples:")
        
        # Find a book with false positives
        fp_examples = []
        for keyword, pos_dict in positions.items():
            if pos_dict['false_positive']:
                fp_examples.append((keyword, pos_dict['false_positive'][0]))
                if len(fp_examples) >= 3:
                    break
        
        if fp_examples:
            print("\nFalse positives (capitalized but no scriptural context):")
            for keyword, example in fp_examples:
                minutes = int(example['start'] // 60)
                seconds = int(example['start'] % 60)
                print(f"{keyword} at {minutes}:{seconds:02d} - {example['context']}")
        
        # Find a book with not counted
        nc_examples = []
        for keyword, pos_dict in positions.items():
            if pos_dict['not_counted']:
                nc_examples.append((keyword, pos_dict['not_counted'][0]))
                if len(nc_examples) >= 3:
                    break
        
        if nc_examples:
            print("\nNot counted (lowercase and no scriptural context):")
            for keyword, example in nc_examples:
                minutes = int(example['start'] // 60)
                seconds = int(example['start'] % 60)
                print(f"{keyword.lower()} at {minutes}:{seconds:02d} - {example['context']}")

        # Full list of not counted
        print("\nFull list of not counted references:")
        not_counted_list = []
        for keyword, pos_dict in positions.items():
            for item in pos_dict['not_counted']:
                not_counted_list.append((keyword, item))
        
        if not_counted_list:
            for keyword, item in not_counted_list:
                minutes = int(item['start'] // 60)
                seconds = int(item['start'] % 60)
                print(f"{keyword.lower()} at {minutes}:{seconds:02d}")
        else:
            print("None")

        # Ask for details
        try:
            while True:
                detail_input = input("\nEnter a book name to see timestamps and context (or 'quit' to exit): ").strip()
                if detail_input.lower() == 'quit':
                    break
                # Make case-insensitive lookup
                detail_input_title = detail_input.title()
                if detail_input_title in positions and any(positions[detail_input_title].values()):
                    print(f"\nOccurrences of '{detail_input_title}':")
                    all_occurrences = []
                    for category, items in positions[detail_input_title].items():
                        for item in items:
                            all_occurrences.append((category, item))
                    
                    # Sort by timestamp
                    all_occurrences.sort(key=lambda x: x[1]['start'])
                    
                    for i, (category, pos) in enumerate(all_occurrences, 1):
                        minutes = int(pos['start'] // 60)
                        seconds = int(pos['start'] % 60)
                        status = category.upper().replace('_', ' ')
                        print(f"{i}. {minutes}:{seconds:02d} [{status}] - {pos['context']}")
                    
                    # Summary
                    valid_count = len(positions[detail_input_title]['valid'])
                    suspect_count = len(positions[detail_input_title]['suspect'])
                    fp_count = len(positions[detail_input_title]['false_positive'])
                    nc_count = len(positions[detail_input_title]['not_counted'])
                    print(f"\nSummary: {valid_count} confirmed, {suspect_count} suspect, {fp_count} false positives, {nc_count} not counted")
                else:
                    print(f"'{detail_input}' not found or no occurrences.")
        except EOFError:
            print("\nExiting... (EOF received)")
        except KeyboardInterrupt:
            print("\nExiting... (Interrupted)")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == '__main__':
    main()