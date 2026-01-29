const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Get video info endpoint
app.get('/api/video-info/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(videoUrl);

        res.json({
            title: info.videoDetails.title,
            author: info.videoDetails.author.name,
            lengthSeconds: info.videoDetails.lengthSeconds,
            thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
            description: info.videoDetails.description
        });
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

// Stream video endpoint
app.get('/api/stream/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Set headers for video streaming
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');

        // Get video info to find best format
        const info = await ytdl.getInfo(videoUrl);

        // Find the best format with both video and audio
        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highestvideo',
            filter: format => format.hasVideo && format.hasAudio
        });

        // Stream the video
        const videoStream = ytdl(videoUrl, {
            format: format,
            quality: 'highestvideo'
        });

        videoStream.pipe(res);

        videoStream.on('error', (err) => {
            console.error('Stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Streaming error' });
            }
        });

    } catch (error) {
        console.error('Error streaming video:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to stream video' });
        }
    }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Open your browser and go to http://localhost:${PORT}`);
});
