class YouTubePlayer {
    constructor() {
        this.videoUrl = document.getElementById('videoUrl');
        this.loadBtn = document.getElementById('loadBtn');
        this.videoContainer = document.getElementById('videoContainer');
        this.playlist = document.getElementById('playlist');
        this.videos = this.loadPlaylist();
        this.currentVideoId = null;

        this.init();
    }

    init() {
        this.loadBtn.addEventListener('click', () => this.loadVideo());
        this.videoUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadVideo();
            }
        });

        this.renderPlaylist();

        // Load last video if available
        if (this.videos.length > 0) {
            this.playVideo(this.videos[0].id);
        }
    }

    extractVideoId(url) {
        // Handle various YouTube URL formats
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/\s]+)/,
            /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    loadVideo() {
        const url = this.videoUrl.value.trim();
        if (!url) {
            alert('Please enter a YouTube URL');
            return;
        }

        const videoId = this.extractVideoId(url);
        if (!videoId) {
            alert('Invalid YouTube URL. Please enter a valid URL.');
            return;
        }

        // Add to playlist if not already there
        if (!this.videos.find(v => v.id === videoId)) {
            this.videos.unshift({
                id: videoId,
                url: url,
                addedAt: new Date().toISOString()
            });
            this.savePlaylist();
            this.renderPlaylist();
        }

        this.playVideo(videoId);
        this.videoUrl.value = '';
    }

    async playVideo(videoId) {
        this.currentVideoId = videoId;

        // Show loading state
        this.videoContainer.innerHTML = `
            <div class="placeholder">
                <div class="loading-spinner"></div>
                <p>Loading video...</p>
            </div>
        `;

        try {
            // Fetch video info from our backend
            const apiBase = window.location.origin;
            const response = await fetch(`${apiBase}/api/video-info/${videoId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch video info');
            }

            const videoData = await response.json();

            // Create HTML5 video player that streams from our backend
            this.videoContainer.innerHTML = `
                <video
                    controls
                    autoplay
                    style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: black;">
                    <source src="${apiBase}/api/stream/${videoId}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="video-info">
                    <h3>${videoData.title}</h3>
                    <p>${videoData.author}</p>
                </div>
            `;

        } catch (error) {
            console.error('Error loading video:', error);

            this.videoContainer.innerHTML = `
                <div class="placeholder error">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>Unable to load video.</p>
                    <p style="margin-top: 10px; font-size: 0.9rem; color: #999;">
                        Make sure the server is running: <code>npm start</code>
                    </p>
                    <p style="margin-top: 10px;">
                        <a href="https://www.youtube.com/watch?v=${videoId}"
                           target="_blank"
                           style="color: #667eea; text-decoration: underline;">
                            Watch on YouTube
                        </a>
                    </p>
                </div>
            `;
        }

        this.renderPlaylist();
    }

    removeVideo(videoId) {
        this.videos = this.videos.filter(v => v.id !== videoId);
        this.savePlaylist();
        this.renderPlaylist();

        // If we removed the current video, play the next one
        if (this.currentVideoId === videoId) {
            if (this.videos.length > 0) {
                this.playVideo(this.videos[0].id);
            } else {
                this.videoContainer.innerHTML = `
                    <div class="placeholder">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 7l-7 5 7 5V7z"></path>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                        </svg>
                        <p>Paste a YouTube URL and click "Load Video" to start watching</p>
                    </div>
                `;
                this.currentVideoId = null;
            }
        }
    }

    renderPlaylist() {
        if (this.videos.length === 0) {
            this.playlist.innerHTML = '<div class="empty-playlist">No videos in queue</div>';
            return;
        }

        this.playlist.innerHTML = this.videos.map(video => `
            <div class="playlist-item ${video.id === this.currentVideoId ? 'active' : ''}"
                 data-video-id="${video.id}">
                <div class="playlist-item-thumbnail">
                    <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" alt="Thumbnail">
                </div>
                <div class="playlist-item-info">
                    <div class="playlist-item-title">Video ID: ${video.id}</div>
                    <div class="playlist-item-id">${new Date(video.addedAt).toLocaleString()}</div>
                </div>
                <button class="playlist-item-remove" data-video-id="${video.id}">Remove</button>
            </div>
        `).join('');

        // Add click handlers
        this.playlist.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('playlist-item-remove')) {
                    const videoId = item.dataset.videoId;
                    this.playVideo(videoId);
                }
            });
        });

        this.playlist.querySelectorAll('.playlist-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const videoId = btn.dataset.videoId;
                this.removeVideo(videoId);
            });
        });
    }

    savePlaylist() {
        try {
            localStorage.setItem('youtube-playlist', JSON.stringify(this.videos));
        } catch (e) {
            console.error('Failed to save playlist:', e);
        }
    }

    loadPlaylist() {
        try {
            const saved = localStorage.getItem('youtube-playlist');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load playlist:', e);
            return [];
        }
    }
}

// Initialize the player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new YouTubePlayer();
});
