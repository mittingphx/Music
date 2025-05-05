/**
 * MiniDemoPlayer.js
 * 
 * A mini player for hosting songs on the web, containing a song list and a player.
 * 
 * @author Scott Mitting
 * @version 0.1.1
 */


/**
 * A class for managing settings for the mini demo player.
 */
class MiniDemoSettings {
    /**
     * Creates a new MiniDemoSettings instance.
     * @param {Object} [overrides] - Optional settings to override defaults
     */
    constructor(overrides = {}) {
        // Default settings
        this.basePath = '../songs/';
        this.defaultImage = '/default-image.png';
        
        // Override settings if provided
        Object.assign(this, overrides);
    }

    /**
     * Get a setting value, with optional override
     * @param {string} key - The setting key
     * @param {*} [defaultValue] - Default value if setting doesn't exist
     * @returns {*} The setting value
     */
    get(key, defaultValue) {
        return this[key] !== undefined ? this[key] : defaultValue;
    }

    /**
     * Set a setting value
     * @param {string} key - The setting key
     * @param {*} value - The value to set
     */
    set(key, value) {
        this[key] = value;
    }
}
MiniDemoSettings.default = new MiniDemoSettings();

// Create global settings object that can be overridden
if (!window.MiniDemoSettings) {
    window.MiniDemoSettings = {
        default: MiniDemoSettings.default,
        override: function(overrides) {
            Object.assign(this.default, overrides);
        }
    };
}

/**
 * A class for managing the song list display and navigation.
 */
class MiniDemoSongList {
    /**
     * Creates a new MiniDemoSongList instance.
     */
    constructor(settings = MiniDemoSettings.default) {
        this.settings = settings;
        this.songs = [];
        this.container = document.getElementById('song-list');
    }

    /**
     * Loads and displays the list of songs.
     */
    async loadSongs() {
        try {
            const response = await fetch(this.settings.get('basePath') + 'manifest.txt');
            const text = await response.text();
            const songs = text.split('\n').filter(song => song.trim());

            const songGrid = document.getElementById('songGrid');
            songs.forEach(song => {
                const card = this.createSongCard(song);
                songGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading songs:', error);
        }
    }

    /**
     * Creates and returns the HTML for a song card.
     * @param {string} songName - The name of the song
     * @returns {HTMLElement} The song card element
     */
    createSongCard(songName) {
        const card = document.createElement('div');
        card.className = 'song-card';

        // Load song info from lyrics file
        fetch(`${this.settings.get('basePath')}${songName}.txt`)
            .then(response => response.text())
            .then(text => {
                const lines = text.split('\n');
                const title = lines[0].replace('# ', '');
                const creditsStart = lines.findIndex(line => line.startsWith('## Credits'));
                const lyricsStart = lines.findIndex(line => line.startsWith('## Lyrics'));
                const imageUrl = this.settings.get('basePath') + songName + '.jpg';
                
                let creditsText = '';
                if (creditsStart !== -1 && lyricsStart !== -1) {
                    creditsText = lines.slice(creditsStart + 1, lyricsStart).join('\n').trim();
                }

                card.innerHTML = `
                    <div class="song-image" style="background-image: url('${imageUrl}')">
                        <div class="song-info">
                            <div class="song-text">
                                <h2 class="song-title">${title}</h2>
                                <div class="song-credits">${creditsText}</div>
                            </div>
                            <div class="song-actions">
                                <button class="action-btn play-btn">Play</button>
                                <button class="action-btn view-btn">View</button>
                            </div>
                        </div>
                    </div>
                `;

                card.querySelector('.play-btn').addEventListener('click', () => {
                    this.playSong(songName);
                });

                card.querySelector('.view-btn').addEventListener('click', () => {
                    this.viewSong(songName);
                });
            });

        return card;
    }

    // Navigate to player
    playSong(songName) {
        window.location.href = `player.html?play=true#${songName}`;
    }

    // Navigate to player (same as playSong for now)
    viewSong(songName) {
        window.location.href = `player.html?play=false#${songName}`;
    }

    /**
     * Exports the MiniDemoSongList class to the global window object for use in other files.
     */
    static exportClass() {
        window.MiniDemoSongList = MiniDemoSongList;
    }
}


/**
 * A class representing a mini music player for web-based song playback.
 * Provides functionality for playing, pausing, and displaying song information.
 */
class MiniDemoPlayer {
    /**
     * Creates a new MiniDemoPlayer instance.
     * 
     * @param {string} songName - The name of the song to play (without file extension)
     * @param {MiniDemoSettings} [settings] - Optional settings object
     */
    constructor(songName, settings = MiniDemoSettings.default) {
        this.songName = songName;
        this.settings = settings;
        if (this.songName.indexOf('?') > -1) {
            this.songName = this.songName.substring(0, this.songName.indexOf('?'));
        }   
        this.audioFile = `${this.settings.get('basePath')}${this.songName}.mp3`;
        this.lyricsFile = `${this.settings.get('basePath')}${this.songName}.txt`;
        this.imageFile = `${this.settings.get('basePath')}${this.songName}.jpg`;
        this.DEFAULT_IMAGE = this.settings.get('defaultImage');
        
        // Check if we should play the song automatically
        const urlParams = new URLSearchParams(window.location.search);
        this.shouldAutoPlay = urlParams.get('play') === 'true';

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
        this.$songName = document.querySelector('.song-name');
        this.songBreadcrumb = document.getElementById('song-breadcrumb');
        this.songCredits = document.getElementById('song-credits');
        this.lyricsDisplay = document.getElementById('lyrics');

        // Initialize player
        this.initializePlayer();
        this.loadSong();
        
        // If we should auto-play, start playing after a short delay
        if (this.shouldAutoPlay) {
            setTimeout(() => {
                this.handleAutoPlay();
            }, 500);            
        }
    }

    /**
     * Handles autoplay for the page.  Since we can't catch certain browser errors
     * if we don't finish this method when auto play is enabled, we will just start
     * the song when the user interacts with the document in any way.
     */
    handleAutoPlay() {

        // set up autoplay
        try {
            this.audio.play();
            this.playBtn.textContent = '⏸️';
        } 
        catch (error) { 
            this.showAutoplayOverlay();
            return;
        }                

        // if the audio is still paused, show the autoplay overlay
        setTimeout(() => {
            if (this.audio.paused) { 
                this.showAutoplayOverlay();
            }
        }, 100);
    }

    /**
     * Shows the autoplay overlay
     */
    showAutoplayOverlay() {
        const overlay = document.getElementById('autoplay-overlay');
        if (overlay) {
            overlay.classList.add('visible');
            
            // Add one-time click handler
            const clickHandler = () => {
                this.audio.play().then(() => {
                    overlay.classList.remove('visible');
                    this.playBtn.textContent = '⏸️';
                }).catch(e => console.error('Playback failed:', e));
                overlay.removeEventListener('click', clickHandler);
            };
            
            overlay.addEventListener('click', clickHandler);
        }
    }

    async togglePlay() {
        if (this.audio.paused) {
            try {
                await this.audio.play();
                this.playBtn.textContent = '⏸️';
                // Hide overlay if it's visible
                const overlay = document.getElementById('autoplay-overlay');
                if (overlay) overlay.classList.remove('visible');
            } catch (error) {
                console.error('Playback failed:', error);
                this.showAutoplayOverlay();
            }
        } else {
            this.audio.pause();
            this.playBtn.textContent = '▶️';
        }
    }

    /**
     * Cleans up the current audio element
     */
    cleanupAudio() {
        if (this.audio) {
            // Remove all event listeners
            const newAudio = this.audio.cloneNode(false);
            this.audio.pause();
            this.audio.src = '';
            this.audio.load();
            if (this.audio.parentNode) {
                this.audio.parentNode.replaceChild(newAudio, this.audio);
            }
            this.audio = newAudio;
        }
    }

    /**
     * Handles hash changes to load the appropriate song
     */
    async handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash && hash !== this.songName) {
            this.songName = decodeURIComponent(hash);
            this.audioFile = `${this.settings.get('basePath')}${this.songName}.mp3`;
            this.lyricsFile = `${this.settings.get('basePath')}${this.songName}.txt`;
            this.imageFile = `${this.settings.get('basePath')}${this.songName}.jpg`;
            
            // Store play state
            const wasPlaying = !this.audio.paused;
            
            try {
                // Clean up current audio
                this.cleanupAudio();
                
                // Create new audio element and set source
                this.audio = new Audio(this.audioFile);
                this.audio.preload = 'auto';
                
                // Reattach event listeners
                this.initializePlayer();
                
                // Wait for the audio to be ready to play
                await new Promise((resolve) => {
                    const canPlay = () => {
                        this.audio.removeEventListener('canplaythrough', canPlay);
                        resolve();
                    };
                    this.audio.addEventListener('canplaythrough', canPlay);
                    
                    // Fallback in case canplaythrough doesn't fire
                    setTimeout(resolve, 1000);
                });
                
                // Load the new song
                await this.loadSong();
                
                // Reset position and play if needed
                this.audio.currentTime = 0;
                if (wasPlaying) {
                    await this.audio.play().catch(e => console.error('Playback failed:', e));
                }
            } catch (error) {
                console.error('Error changing song:', error);
            }
        }
    }

    /**
     * Sets up the progress bar handlers
     */
    setupProgressBar() {
        this.progressBar = document.getElementById('progress-bar');
        this.progressFill = document.querySelector('.progress-fill');
        
        if (this.progressBar) {
            // Handle input (while dragging)
            this.progressBar.addEventListener('input', (e) => {
                const seekTime = (e.target.value / 100) * this.audio.duration;
                this.audio.currentTime = seekTime;
                this.updateProgressFill();
            });
            
            // Handle change (after release)
            this.progressBar.addEventListener('change', () => {
                if (!this.audio.paused) {
                    this.audio.play();
                }
            });
        }
    }
    
    /**
     * Updates the progress fill based on current time
     */
    updateProgressFill() {
        if (this.progressBar && this.progressFill && !isNaN(this.audio.duration)) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.value = progress;
            //this.progressFill.style.width = `${progress}%`;
        }
    }

    /**
     * Initializes the player by setting up event listeners and UI elements.
     */
    initializePlayer() {
        // Event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleSongEnd());

        // Button event listeners
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.handlePrev());
        this.nextBtn.addEventListener('click', () => this.handleNext());

        // Set up progress bar
        this.setupProgressBar();
        
        // If audio is not playing, update the progress bar immediately
        if (this.audio.paused) {
            this.updateProgress();
        }
        
        // Handle hash changes for navigation
        window.addEventListener('hashchange', () => this.handleHashChange());
    }

    /**
     * Loads the song's audio, image, and lyrics from the server.
     * Handles errors and displays appropriate fallbacks.
     */
    async loadSong() {
        // Load image
        this.songImage.src = this.imageFile;
        this.songImage.onerror = () => {
            this.songImage.onerror = () => {};
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

            
            // Find the credits section
            const creditsIndex = lines.indexOf('## Credits');
            const lyricsIndex = lines.indexOf('## Lyrics');
            
            // Extract and format credits
            const credits = {};
            if (creditsIndex !== -1 && lyricsIndex !== -1) {
                const creditsLines = lines.slice(creditsIndex + 1, lyricsIndex);                
                const formattedCredits = creditsLines
                    .map(line => {
                        const [key, value] = line.split(':').map(part => part.trim());
                        if (key && value) {
                            credits[key] = value;
                            return `${key}: ${value}`;
                        }
                        return line.trim();
                    })
                    .filter(line => line)
                    .join('<br>');
                
                this.songCredits.innerHTML = formattedCredits;
            }

            // Extract and format song title and artist
            const songTitle = lines[0].replace('#', '').trim();
            const artist = credits['Artist'];
            this.setSongTitle(songTitle, artist);

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

    /**
     * Updates the progress bar and current time display
     */
    updateProgress() {
        this.updateProgressFill();
        if (this.currentTime && !isNaN(this.audio.currentTime)) {
            this.currentTime.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    /**
     * Formats time in seconds to MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    /**
     * Updates the duration display
     */
    updateDuration() {
        if (!isNaN(this.audio.duration)) {
            this.duration.textContent = this.formatTime(this.audio.duration);
        }
    }

    /**
     * Toggles the playback state of the audio.
     * Changes the play/pause button icon accordingly.
     */
    togglePlay() {
        this.setPlayState(this.audio.paused);
    }

    /**
     * Plays or pauses the audio based on the shouldPlay parameter.
     * Updates the play/pause button icon accordingly.
     * 
     * @param {boolean} shouldPlay - Whether to play or pause the audio
     */
    setPlayState(shouldPlay) {
        if (shouldPlay) {
            this.audio.play();
            this.playBtn.textContent = '⏸️';
        } else {
            this.audio.pause();
            this.playBtn.textContent = '▶️';
        }
    }

    /**
     * Sets the song title in the UI.
     * 
     * @param {string} title - The title of the song
     * @param {string} artist - The artist of the song
     */
    setSongTitle(title, artist) {
        this.songTitle.textContent = title;
        this.songBreadcrumb.textContent = title;
        this.$songName.innerHTML = '<b>' + title + '</b>' + (artist ? ' <small>by ' + artist + '</small>' : '');
    }


    /**
     * Updates the progress bar and current time display based on audio playback.
     */
    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        //this.progressBar.style.width = `${progress}%`;
        this.progressBar.value = progress;
        this.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }

    /**
     * Updates the duration display with the total length of the audio.
     */
    updateDuration() {
        this.duration.textContent = this.formatTime(this.audio.duration);
    }

    /**
     * Formats seconds into a MM:SS time string.
     * 
     * @param {number} seconds - The time in seconds to format
     * @returns {string} Formatted time string (e.g., "03:45")
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Handles the end of a song by simulating a click on the next button
     */
    handleSongEnd() {
        this.playBtn.textContent = '▶️';
        // Simulate a click on the next button to ensure consistent behavior
        this.navigateSong(1, true);
    }

    /**
     * Loads the song list from manifest.txt
     * @returns {Promise<Array<string>>} Array of song names
     */
    async loadSongList() {
        try {
            const response = await fetch(this.settings.get('basePath') + 'manifest.txt');
            const text = await response.text();
            return text.split('\n').filter(song => song.trim());
        } catch (error) {
            console.error('Error loading song list:', error);
            return [];
        }
    }

    /**
     * Gets the current song index from the manifest
     * @param {Array<string>} songList - List of song names
     * @returns {number} Index of current song, or -1 if not found
     */
    getCurrentSongIndex(songList) {
        return songList.findIndex(song => song === this.songName);
    }

    /**
     * Navigates to a song by its index in the manifest
     * @param {number} direction - 1 for next, -1 for previous
     * @param {boolean} autoplay - Whether to autoplay the song
     */
    async navigateSong(direction, autoplay = false) {
        const songList = await this.loadSongList();
        if (songList.length === 0) return;
        
        let currentIndex = this.getCurrentSongIndex(songList);
        if (currentIndex === -1) currentIndex = 0;
        
        let newIndex = currentIndex + direction;
        
        // Handle wrapping
        if (newIndex < 0) {
            newIndex = songList.length - 1;
        } else if (newIndex >= songList.length) {
            newIndex = 0;
        }
        
        // Only navigate if we have a valid new song
        if (newIndex !== currentIndex) {
            const newSong = songList[newIndex];
            const newUrl = `player.html?play=true#${encodeURIComponent(newSong)}`;
            
            // Update the URL without reloading the page
            window.history.pushState({ song: newSong }, '', newUrl);
            
            // Trigger the hash change handler to load the new song
            this.handleHashChange();

            // start the song if autoplay is enabled
            if (autoplay) {
                this.playBtn.click();
            }
        }
    }

    /**
     * Handles the previous song button click.
     */
    handlePrev() {
        this.navigateSong(-1);
    }

    /**
     * Handles the next song button click.
     */
    handleNext() {
        this.navigateSong(1);
    }

    /**
     * Exports the MiniDemoPlayer class to the global window object for use in other files.
     */
    static exportClass() {
        window.MiniDemoPlayer = MiniDemoPlayer;
    }
}

// Export the classes
MiniDemoPlayer.exportClass();
if (typeof MiniDemoSongList !== 'undefined') {
    MiniDemoSongList.exportClass();
}
