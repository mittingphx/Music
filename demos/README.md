# demos/ folder

This folder contains the demo player and demo list, which pulls the
list of songs to play from the `songs/` folder.  The manifest.txt file
contains the list of songs to play, with one song per line.

Try this demo now at [http://localhost:3000/demos/](http://localhost:3000/demos/)
or online at [https://mittingphx.github.io/Music/demos/](https://mittingphx.github.io/Music/demos/)

## Key Web Pages

### index.html

This is the demo list, which is a simple HTML page that lists the songs
in the `songs/` folder.


### player.html

This is the demo player, which is a simple HTML page that uses the
MiniDemoPlayer.js library to play the songs.

## Player Library

### MiniDemoPlayer.js

This is the demo player's JavaScript file, which contains the logic for
playing the songs.

## Other Files in demos/

### index.css

This is the demo list's CSS file, which contains the styles for the demo list.

### player.css

This is the demo player's CSS file, which contains the styles for the demo player.

# songs/ Folder

This folder contains the songs to play.

## Manifest File

The manifest.txt file contains the list of songs to play, with one song per line, for example:

```
stay-away-the-sad-ones
still-we-bleed
```

## Song Files

This folder contains the songs to play.  The songs are stored in a single `/songs` directory, with each song's files grouped together by name but with different extensions:

### .mp3

This is the audio file for the song.  It must be named the same as the song, for example `stay-away-the-sad-ones.mp3`.  
The extension must be lowercase and be "mp3".  Other common extensions like "m4a" are not allowed.

### .jpg

This is the cover art for the song.  It must be named the same as the song, for example `stay-away-the-sad-ones.jpg`.  
The extension must be lowercase and be "jpg".  Other common extensions like "jpeg" are not allowed.

The suggested resolution is 1024x1024 pixels.

### .txt

This is the song's metadata, including the title, artist, and album.  It must be named the same as the song, for example `stay-away-the-sad-ones.txt`.  The extension must be lowercase and be "txt".  

The metadata file should be formatted as follows:

```
Title: Stay Away the Sad Ones
Artist: Scott Mitting
Album: Stay Away the Sad Ones
```

The list of metadata keys are arbitrary, and will be displayed in the order they appear in the file.
