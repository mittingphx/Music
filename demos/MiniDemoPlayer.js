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
        this.defaultImage = '../default-image.jpg';
        
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

        // Set up an emergency play feature in case autoplay is blocked
        const emergencyPlayOnClick = () => {
            this.setPlayState(true);
            document.removeEventListener('click', emergencyPlayOnClick);
        }
        const onAutoPlayFailed = () => {
            alert('AUTOPLAY FAILED:\nPlease allow autoplay in your browser settings to play the song.\nYou will need to click anywhere in the browser to start the song.');            
            document.addEventListener('click', emergencyPlayOnClick);
        }

        // set up autoplay
        try {
            this.audio.play();
            this.playBtn.textContent = '⏸️';
        } 
        catch (error) {
            onAutoPlayFailed();
            return;
        }                

        // remove the emergency play feature if the play succeeded
        setTimeout(() => {
            if (this.audio.paused) {
                onAutoPlayFailed();
            }
        }, 100);
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
        
        // Progress bar click to seek
        const progressContainer = document.querySelector('.progress-container');
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = pos * this.audio.duration;
            
            // If audio is not playing, update the progress bar immediately
            if (this.audio.paused) {
                this.updateProgress();
            }
        });
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
            this.setSongTitle(lines[0].replace('# ', ''));

            
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
     */
    setSongTitle(title) {
        this.songTitle.textContent = title;
        this.songBreadcrumb.textContent = title;
    }


    /**
     * Updates the progress bar and current time display based on audio playback.
     */
    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressBar.style.width = `${progress}%`;
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
     * Handles the end of a song by updating the play button icon.
     */
    handleSongEnd() {
        this.playBtn.textContent = '▶️';
    }

    /**
     * Handles the previous song button click.
     * Currently a placeholder for future playlist functionality.
     */
    handlePrev() {
        // To be implemented with playlist support
        console.log('Previous song not implemented');
    }

    /**
     * Handles the next song button click.
     * Currently a placeholder for future playlist functionality.
     */
    handleNext() {
        // To be implemented with playlist support
        console.log('Next song not implemented');
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
MiniDemoSongList.exportClass();
