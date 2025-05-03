# Music Demos Application - app.sh Usage Guide

## Overview

`app.sh` is a command-line tool for managing the Music Demos application. It provides commands for starting/stopping the server, testing the site, and managing songs.

## Requirements

- Python 3.7 or higher
- lsof (for port management)
- A web browser opener command (powershell.exe, open, explorer.exe, or wslview)

## Commands

### Start Server
```bash
wsl ./app.sh start
```

- Starts the development server on port 3000 with the `public` directory as the root
- Automatically opens the browser to http://localhost:3000
- Checks for required dependencies and installs them if needed
- The server serves files from the `public` directory, which contains both `demos/` and `songs/` folders

### Stop Server
```bash
wsl ./app.sh stop
```

- Stops the running server
- Cleans up any leftover processes
- Displays a success message when complete

### Test Site
```bash
wsl ./app.sh test
```

- Opens the site in the default web browser
- Useful for quickly accessing the site without starting the server

### List Songs
```bash
wsl ./app.sh list
```

- Displays a list of all available songs
- Shows song titles, file paths, and any associated metadata
- Helps verify that songs are properly configured

## Usage Examples

1. Start the server:
```bash
wsl ./app.sh start
```

2. Stop the server:
```bash
wsl ./app.sh stop
```

3. Test the site:
```bash
wsl ./app.sh test
```

4. List all songs:
```bash
wsl ./app.sh list
```

## Troubleshooting

### Common Issues

1. **Python not found**
   - Install Python 3.7 or higher from https://www.python.org/
   - Ensure Python is added to your system's PATH

2. **Port in use**
   - Use the `stop` command to terminate any running servers
   - Check if another application is using port 3000

3. **Browser not opening**
   - Ensure your system has a default web browser set
   - Try using the `test` command to manually open the site

## Notes

- Always use `wsl ./app.sh` when running commands from Windows
- The server runs in WSL (Windows Subsystem for Linux)
- Web-accessible files are stored in the `./public/` directory:
  - `demos/` - Contains the demo player and related files
  - `songs/` - Contains audio files, images, and lyrics
- The application version is 0.1.0
