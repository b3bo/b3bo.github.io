# YouTube Transcript Keyword Counter

This Python application reads the transcript from a YouTube video and counts occurrences of specified keywords. By default, it counts references to the 66 books of the Bible.

## Features

- Extract video ID from various YouTube URL formats
- Retrieve video transcripts using YouTube Transcript API
- Count keyword occurrences in the transcript
- Default to counting all 66 books of the Bible
- Command-line interface

## Installation

1. Install Python 3.7+
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Count Bible book references in a sermon video:
```bash
python main.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

Or run without arguments to be prompted for the URL:
```bash
python main.py
```

Count custom keywords:
```bash
python main.py "https://www.youtube.com/watch?v=VIDEO_ID" --keywords keyword1 keyword2 keyword3
```

Example with custom keywords:
```bash
python main.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --keywords "never" "gonna" "give" "you" "up"
```

## Future Enhancements

- Fetch latest videos from church channels
- Filter videos by duration (e.g., sermons over X minutes)
- Export results to CSV/JSON
- Web interface