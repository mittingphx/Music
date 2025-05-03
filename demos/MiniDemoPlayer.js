class MiniDemoPlayer {
    constructor(songName) {
        this.songName = songName;
        this.audioFile = `../songs/${songName}.mp3`;
        this.lyricsFile = `../songs/${songName}.txt`;
        this.imageFile = `../songs/${songName}.jpg`;
        this.DEFAULT_IMAGE = 'default-image.jpg';

        // DOM Elements
        this.audio = new Audio(this.audioFile);
        this.progressBar = document.getElementById('progress-bar');
        this.currentTime = document.getElementById('current-time');
        this.duration = document.getElementById('duration');
        this.playBtn = document.getElementById('play-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.songImage = document.getElementById('song-image');
        this.songTitle = document.getElementById('song-title');
        this.songCredits = document.getElementById('song-credits');
        this.lyricsDisplay = document.getElementById('lyrics');

        // Initialize player
        this.initializePlayer();
        this.loadSong();
    }

    initializePlayer() {
        // Event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleSongEnd());

        // Button event listeners
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.handlePrev());
        this.nextBtn.addEventListener('click', () => this.handleNext());
    }

    async loadSong() {
        // Load image
        this.songImage.src = this.imageFile;
        this.songImage.onerror = () => {
            this.songImage.src = this.DEFAULT_IMAGE;
        };

        try {
            // Load lyrics
            const response = await fetch(this.lyricsFile);
            const text = await response.text();
            
            // Replace CRLF with LF for consistent line endings
            const normalizedText = text.replace(/\r\n/g, '\n');
            
            // Parse lyrics file to extract title and credits
            const lines = normalizedText.split('\n');
            this.songTitle.textContent = lines[0].replace('# ', '');
            
            // Find the credits section
            const creditsIndex = lines.indexOf('## Credits');
            const lyricsIndex = lines.indexOf('## Lyrics');
            
            // Extract and format credits
            if (creditsIndex !== -1 && lyricsIndex !== -1) {
                const creditsLines = lines.slice(creditsIndex + 1, lyricsIndex);
                const formattedCredits = creditsLines
                    .map(line => {
                        const [key, value] = line.split(':').map(part => part.trim());
                        if (key && value) {
                            return `${key}: ${value}`;
                        }
                        return line.trim();
                    })
                    .filter(line => line)
                    .join('<br>');
                
                this.songCredits.innerHTML = formattedCredits;
            }

            // Extract and format lyrics
            if (lyricsIndex !== -1) {
                const lyricsLines = lines.slice(lyricsIndex + 1);
                const formattedLyrics = lyricsLines
                    .map(line => line.trim())
                    .filter(line => line)
                    .join('<br>');
                
                this.lyricsDisplay.innerHTML = formattedLyrics;
            }
        } catch (error) {
            this.lyricsDisplay.textContent = 'Error loading lyrics';
        }
    }

    togglePlay() {
        if (this.audio.paused) {
            this.audio.play();
            this.playBtn.textContent = '⏸️';
        } else {
            this.audio.pause();
            this.playBtn.textContent = '▶️';
        }
    }

    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        this.duration.textContent = this.formatTime(this.audio.duration);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    handleSongEnd() {
        this.playBtn.textContent = '▶️';
    }

    handlePrev() {
        // To be implemented with playlist support
        console.log('Previous song not implemented');
    }

    handleNext() {
        // To be implemented with playlist support
        console.log('Next song not implemented');
    }
}

// Export for use in other files
window.MiniDemoPlayer = MiniDemoPlayer;
