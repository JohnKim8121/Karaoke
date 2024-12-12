class YouTubeHandler {
    constructor() {
        this.player = null;
        this.ready = false;
        this.playlist = [];
        this.currentIndex = 0;
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.searchSuggestions = document.getElementById('search-suggestions');
        this.searchResults = document.getElementById('search-results');
        this.setupSearchListeners();
        this.apiKey = 'AIzaSyABtLDcJdC0rhGEQrSwD6_6QRPNh6bFSDU';
    }

    setupSearchListeners() {
        let debounceTimer;
        
        this.searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.getSearchSuggestions(this.searchInput.value);
            }, 300);
        });

        this.searchButton.addEventListener('click', () => {
            this.searchVideos(this.searchInput.value);
        });

        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchVideos(this.searchInput.value);
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target)) {
                this.searchSuggestions.style.display = 'none';
            }
        });
    }

    async getSearchSuggestions(query) {
        if (!query) {
            this.searchSuggestions.style.display = 'none';
            return;
        }

        try {
            // Direct YouTube Data API call instead of using server endpoint
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${this.apiKey}`
            );
            const data = await response.json();
            
            if (!data.items) return;
            
            this.searchSuggestions.innerHTML = '';
            data.items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = item.snippet.title;
                div.onclick = () => {
                    this.searchInput.value = item.snippet.title;
                    this.searchVideos(item.snippet.title);
                    this.searchSuggestions.style.display = 'none';
                };
                this.searchSuggestions.appendChild(div);
            });
            
            this.searchSuggestions.style.display = data.items.length ? 'block' : 'none';
        } catch (error) {
            console.error('Failed to get search suggestions:', error);
            this.searchSuggestions.style.display = 'none';
        }
    }

    initialize(onPlayerReady) {
        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            this.player = new YT.Player('youtube-player', {
                height: '360',
                width: '640',
                videoId: '',
                events: {
                    'onReady': onPlayerReady
                }
            });
        };
    }

    async searchVideos(query) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${this.apiKey}`
            );
            const data = await response.json();
            this.displaySearchResults(data.items);
        } catch (error) {
            console.error('Failed to search videos:', error);
        }
    }

    displaySearchResults(videos) {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';
        
        videos.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'video-result';
            videoElement.innerHTML = `
                <img src="${video.snippet.thumbnails.default.url}" alt="${video.snippet.title}">
                <h3>${video.snippet.title}</h3>
            `;
            videoElement.addEventListener('click', () => {
                this.player.loadVideoById(video.id.videoId);
            });
            resultsContainer.appendChild(videoElement);
        });
    }

    addToPlaylist(videoId) {
        this.playlist.push(videoId);
    }

    playNext() {
        if (this.currentIndex < this.playlist.length - 1) {
            this.currentIndex++;
            this.loadVideo(this.playlist[this.currentIndex]);
        }
    }

    playPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.loadVideo(this.playlist[this.currentIndex]);
        }
    }

    loadVideo(videoId) {
        if (this.player && this.ready) {
            this.player.loadVideoById(videoId);
        }
    }
}

export { YouTubeHandler };
