# Scripture Counter - GitHub Pages Setup

This guide will help you set up the Scripture Counter as a standalone GitHub Pages site.

## Step 1: Create New Repository

1. Go to GitHub.com and create a new repository
2. Name it `scripture-counter` (or your preferred name)
3. Make it public
4. **Important**: Do NOT initialize with README, .gitignore, or license

## Step 2: Clone and Setup

```bash
# Clone your new repository
git clone https://github.com/YOUR_USERNAME/scripture-counter.git
cd scripture-counter

# Copy files from the Scripture Counter folder
# (You'll need to copy the files from your existing project)
```

## Step 3: Repository Structure

Your new repository should have these files in the root:

```
scripture-counter/
├── index.html          # Main dashboard
├── video.html          # Individual video details
├── results.json        # Generated data (initially empty {})
├── .nojekyll          # GitHub Pages configuration
├── main.py            # CLI analysis tool
├── app.py             # Flask web server (optional)
├── requirements.txt   # Python dependencies
├── README.md          # Project documentation
├── patterns.md        # Detection patterns documentation
└── .github/           # GitHub Actions/Copilot instructions
```

## Step 4: Enable GitHub Pages

1. Go to your repository settings
2. Scroll down to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Select "main" branch and "/ (root)" folder
5. Click "Save"

## Step 5: Initial Setup

1. Create an initial empty `results.json`:
```json
{}
```

2. Commit and push:
```bash
git add .
git commit -m "Initial setup for Scripture Counter dashboard"
git push origin main
```

## Step 6: Access Your Site

After a few minutes, your site will be available at:
`https://YOUR_USERNAME.github.io/scripture-counter/`

## Step 7: Process Videos

To add data to your dashboard:

1. Install dependencies locally:
```bash
pip install -r requirements.txt
```

2. Run analysis on YouTube videos:
```bash
python main.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

3. The results will be saved to `results.json`

4. Commit and push the updated `results.json`:
```bash
git add results.json
git commit -m "Add analysis for VIDEO_TITLE"
git push origin main
```

## Step 8: Automatic Updates (Optional)

You can set up GitHub Actions to automatically update the site when you push new results, but for now, manual updates work fine.

## Local Development

To test locally before deploying:

```bash
# Run Flask web server
python main.py --web

# Or open index.html directly in browser (requires results.json)
```

## Customization

- Modify `index.html` and `video.html` to change the dashboard appearance
- Update patterns in `main.py` for different detection rules
- Add more videos by running the analysis tool

## Notes

- The site uses static HTML/CSS/JS for GitHub Pages compatibility
- Data is stored in `results.json` which gets updated with each video analysis
- The dashboard automatically displays all processed videos
- Dark mode is enabled by default with a toggle option