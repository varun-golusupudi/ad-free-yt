# Ad-Free YouTube Player

A simple web application that lets you watch YouTube videos without ads.

## Features

- Paste YouTube URLs and watch videos ad-free
- Video queue management
- Clean, modern interface
- No ads, no tracking
- Videos persist in your queue

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and go to:
```
http://localhost:3000
```

## Usage

1. Paste a YouTube URL in the input field
2. Click "Load Video" or press Enter
3. Video will start playing without ads
4. Videos are added to your queue for easy access

## How it works

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Video streaming: ytdl-core (downloads and streams videos directly)
- No ads because videos are streamed through our server, not YouTube's player

## Requirements

- Node.js 14 or higher
- npm or yarn

## Troubleshooting

If videos won't play:
- Make sure the server is running (`npm start`)
- Check that port 3000 is not in use
- Some videos may be age-restricted or region-locked

## Note

This tool is for personal use only. Please respect YouTube's Terms of Service and content creators by supporting them through official channels when possible.
