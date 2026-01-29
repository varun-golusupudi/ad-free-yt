const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Get video info and stream URL endpoint
app.get('/api/video-info/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(videoUrl);

        // Find the best format with both video and audio
        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highestvideo',
            filter: format => format.hasVideo && format.hasAudio
        });

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

// Stream video endpoint with range request support
app.get('/api/stream/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Get video info to find best format
        const info = await ytdl.getInfo(videoUrl);

        // Find the best format with both video and audio
        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highestvideo',
            filter: format => format.hasVideo && format.hasAudio
        });

        // Handle range requests for seeking
        const range = req.headers.range;
        const contentLength = format.contentLength;

        if (range && contentLength) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : parseInt(contentLength) - 1;
            const chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${contentLength}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            });

            const videoStream = ytdl(videoUrl, {
                format: format,
                range: { start, end }
            });

            videoStream.pipe(res);

            videoStream.on('error', (err) => {
                console.error('Stream error:', err);
                if (!res.headersSent) {
                    res.status(500).end();
                }
            });
        } else {
            // No range request, stream full video
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Accept-Ranges', 'bytes');
            if (contentLength) {
                res.setHeader('Content-Length', contentLength);
            }

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
        }

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
