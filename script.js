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

            // Create custom HTML5 video player with enhanced controls
            this.videoContainer.innerHTML = `
                <video
                    id="videoPlayer"
                    autoplay
                    style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: black;">
                    <source src="${apiBase}/api/stream/${videoId}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="custom-controls">
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-filled"></div>
                        </div>
                    </div>
                    <div class="controls-bottom">
                        <button class="control-btn play-pause">
                            <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            <svg class="pause-icon" width="24" height="24" viewBox="0 0 24 24" fill="white" style="display: none;">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            </svg>
                        </button>
                        <div class="time-display">
                            <span class="current-time">0:00</span>
                            <span class="separator">/</span>
                            <span class="duration">0:00</span>
                        </div>
                        <div class="volume-control">
                            <button class="control-btn volume-btn">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                                </svg>
                            </button>
                            <input type="range" class="volume-slider" min="0" max="100" value="100">
                        </div>
                        <button class="control-btn fullscreen-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="video-info">
                    <h3>${videoData.title}</h3>
                    <p>${videoData.author}</p>
                </div>
            `;

            this.setupVideoPlayer();

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

    setupVideoPlayer() {
        const video = document.getElementById('videoPlayer');
        if (!video) return;

        const playPauseBtn = document.querySelector('.play-pause');
        const playIcon = document.querySelector('.play-icon');
        const pauseIcon = document.querySelector('.pause-icon');
        const progressBar = document.querySelector('.progress-bar');
        const progressFilled = document.querySelector('.progress-filled');
        const currentTimeDisplay = document.querySelector('.current-time');
        const durationDisplay = document.querySelector('.duration');
        const volumeBtn = document.querySelector('.volume-btn');
        const volumeSlider = document.querySelector('.volume-slider');
        const fullscreenBtn = document.querySelector('.fullscreen-btn');

        // Format time helper
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Play/Pause
        const togglePlayPause = () => {
            if (video.paused) {
                video.play();
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                video.pause();
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        };

        playPauseBtn.addEventListener('click', togglePlayPause);
        video.addEventListener('click', togglePlayPause);

        // Seek functionality with drag support
        let isDragging = false;
        let wasPaused = false;

        const updateProgress = (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const newTime = percent * video.duration;

            // Update visual feedback immediately
            progressFilled.style.width = `${percent * 100}%`;
            currentTimeDisplay.textContent = formatTime(newTime);

            // Update video time
            video.currentTime = newTime;
        };

        progressBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            wasPaused = video.paused;
            video.pause(); // Pause while seeking for smoother experience
            updateProgress(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updateProgress(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (!wasPaused) {
                    video.play(); // Resume if it was playing
                }
            }
        });

        // Update progress bar (only when not dragging)
        video.addEventListener('timeupdate', () => {
            if (!isDragging) {
                const percent = (video.currentTime / video.duration) * 100;
                progressFilled.style.width = `${percent}%`;
                currentTimeDisplay.textContent = formatTime(video.currentTime);
            }
        });

        // Update duration
        video.addEventListener('loadedmetadata', () => {
            durationDisplay.textContent = formatTime(video.duration);
        });

        // Volume control
        volumeSlider.addEventListener('input', (e) => {
            video.volume = e.target.value / 100;
        });

        volumeBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            volumeSlider.value = video.muted ? 0 : video.volume * 100;
        });

        // Fullscreen
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                this.videoContainer.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        // Keyboard shortcuts
        const handleKeyPress = (e) => {
            // Don't trigger shortcuts if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Only work when video exists
            if (!video) return;

            switch(e.key) {
                case ' ':
                case 'k':
                case 'K':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 5);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration, video.currentTime + 5);
                    break;
                case 'j':
                case 'J':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    break;
                case 'l':
                case 'L':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    video.volume = Math.min(1, video.volume + 0.1);
                    volumeSlider.value = video.volume * 100;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    video.volume = Math.max(0, video.volume - 0.1);
                    volumeSlider.value = video.volume * 100;
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    video.muted = !video.muted;
                    volumeSlider.value = video.muted ? 0 : video.volume * 100;
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    if (!document.fullscreenElement) {
                        this.videoContainer.requestFullscreen();
                    } else {
                        document.exitFullscreen();
                    }
                    break;
            }
        };

        // Remove any existing keyboard listeners first
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        // Store handler reference so we can remove it later
        this.keyboardHandler = handleKeyPress;
        document.addEventListener('keydown', handleKeyPress);

        // Show controls on hover
        const controls = document.querySelector('.custom-controls');
        let hideControlsTimeout;

        const showControls = () => {
            controls.style.opacity = '1';
            clearTimeout(hideControlsTimeout);
            hideControlsTimeout = setTimeout(() => {
                if (!video.paused) {
                    controls.style.opacity = '0';
                }
            }, 2000);
        };

        this.videoContainer.addEventListener('mousemove', showControls);
        this.videoContainer.addEventListener('mouseleave', () => {
            if (!video.paused) {
                controls.style.opacity = '0';
            }
        });

        video.addEventListener('play', () => {
            hideControlsTimeout = setTimeout(() => {
                controls.style.opacity = '0';
            }, 2000);
        });

        video.addEventListener('pause', () => {
            controls.style.opacity = '1';
        });
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
