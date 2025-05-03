# Music Demo Project Architecture

## Overview
This project is a web-based music demo player that showcases original compositions by Scott Mitting. The architecture is designed to be simple, maintainable, and easy to extend.

## Project Structure

```
project-root/
├── docs/           # Documentation
├── songs/          # Song files
│   ├── *.mp3      # Audio files
│   ├── *.txt      # Lyrics files
│   └── *.jpg      # Cover images
├── demos/          # Web application
│   ├── index.html  # Main page
│   ├── player.html # Song player
│   └── MiniDemoPlayer.js # Player functionality
├── app.sh         # Server management script
└── README.md      # Project documentation
```

## Key Components

### 1. Web Application (`demos/`)
- **index.html**: Main landing page that displays a grid of song cards
- **player.html**: Individual song player page
- **MiniDemoPlayer.js**: Contains all player functionality, including:
  - Audio playback
  - Lyrics display
  - Progress tracking
  - Image handling

### 2. Song Management (`songs/`)
- Each song has three required files:
  - Audio file (`.mp3`)
  - Lyrics file (`.txt`)
  - Cover image (`.jpg`)
- Lyrics files follow a specific format with sections for title, credits, and lyrics

### 3. Server Management (`app.sh`)
- Written in Bash for WSL compatibility
- Handles starting/stopping the development server
- Automatically installs Python if needed
- Uses port 3000 by default

## Data Flow

1. **Song Loading**
   - Songs are listed in `songs/manifest.txt`
   - Each song card is generated dynamically from this list
   - Clicking a card navigates to the player page

2. **Player Initialization**
   - Player loads song metadata from the URL hash
   - Fetches lyrics file for credits and lyrics
   - Loads audio file for playback
   - Displays cover image

3. **Lyrics Parsing**
   - Lyrics files are parsed to extract:
     - Song title (from first line)
     - Credits (between ## Credits and ## Lyrics)
     - Lyrics (after ## Lyrics)
   - Credits are displayed as key-value pairs
   - Lyrics maintain proper line breaks and formatting

## Best Practices

1. **File Organization**
   - Keep all song files in the `songs/` directory
   - Use consistent naming with hyphens (e.g., `stay-away-the-sad-ones`)
   - Maintain matching file extensions for each song

2. **Code Structure**
   - Keep JavaScript in dedicated `.js` files
   - HTML files should only contain initialization code
   - Avoid inline JavaScript

3. **Development**
   - Use WSL for server management
   - Test changes locally before deployment
   - Follow the file format specifications in [PROJECT_GUIDELINES.md](../PROJECT_GUIDELINES.md)

## Future Improvements

1. **Player Features**
   - Add playlist functionality
   - Implement shuffle and repeat modes
   - Add volume control

2. **UI Enhancements**
   - Improve responsive design
   - Add dark mode support
   - Enhance lyrics display formatting

3. **Backend Improvements**
   - Add song metadata API
   - Implement search functionality
   - Add user preferences storage
