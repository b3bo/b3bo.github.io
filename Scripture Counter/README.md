# YouTube Transcript Keyword Counter

This Python application reads the transcript from a YouTube video and counts occurrences of specified keywords.

## Features

- Extract video ID from various YouTube URL formats
- Retrieve video transcripts using YouTube Transcript API
- Count keyword occurrences in the transcript
- Command-line interface

## Installation

1. Install Python 3.7+
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

```bash
python main.py "https://www.youtube.com/watch?v=VIDEO_ID" --keywords keyword1 keyword2 keyword3
```

Example:
```bash
python main.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --keywords "never" "gonna" "give" "you" "up"
```

## Future Enhancements

- Fetch latest videos from church channels
- Filter videos by duration (e.g., sermons over X minutes)
- Export results to CSV/JSON
- Web interface