# ManaMeter

A Python application that analyzes YouTube video transcripts to count Scripture references, with a modern web dashboard hosted on GitHub Pages.

## 🚀 Quick Start

**Live Demo**: [View the dashboard](https://your-username.github.io/scripture-counter/)

**Setup Guide**: See [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md) for complete setup instructions.

## Features

- Extract video ID from various YouTube URL formats
- Retrieve video transcripts using YouTube Transcript API
- Advanced Scripture reference detection with pattern matching and chapter validation
- Categorize references as Confirmed, Suspect, False Positives, and Not Counted
- Modern web dashboard with dark/light mode
- Interactive charts and detailed analysis
- JSON data export for all processed videos
- Hosted on GitHub Pages for easy access

## Installation

1. Install Python 3.7+
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Command Line Analysis

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

### Web Interface

The web dashboard is available at: https://b3bo.github.io/scripture-counter/

To run locally:
```bash
python main.py --web
```

## Web Dashboard Features

- **Dashboard Overview**: Statistics across all processed videos
- **Video Details**: Individual video analysis with charts
- **Dark/Light Mode**: Toggle between themes
- **Interactive Charts**: Visualize Scripture references by book
- **Real-time Updates**: Dashboard updates as new videos are processed

## Data Storage

Results are stored in `results.json` with:
- Video metadata (title, channel, processing date)
- Statistics for each analysis category
- Reference counts for all 66 Bible books
- Suspect reference counts

## Deployment

The web interface is automatically deployed to GitHub Pages. To update:

1. Process new videos using the command line tool
2. Commit and push changes to the `main` branch
3. GitHub Pages will automatically update the live site

## Technical Details

### Detection Algorithm

1. **Capitalization Check**: Bible book names must be capitalized
2. **Pattern Proximity**: Scriptural context within 50 characters
3. **Chapter Validation**: Verify chapter numbers against known book lengths
4. **Categorization**:
   - Confirmed: Capitalized + scriptural context
   - Suspect: Lowercase + scriptural context
   - False Positive: Capitalized + no context
   - Not Counted: Lowercase + no context

### Supported Patterns

- Book references: "book of [Book]"
- Chapter/verse citations: "chapter 3", "verse 16", "3:16"
- Contextual phrases: "says", "teaches", "according to", etc.
- Chapter validation: "Revelation 22" (valid), "Revelation 23" (invalid)

## Future Enhancements

- Batch processing of multiple videos
- Channel monitoring for automatic video discovery
- Advanced filtering and search capabilities
- API endpoints for external integrations
- Export functionality (CSV, PDF reports)