# Music Demo Project Structure and Automation Rules

## Project Organization

All song files are stored in a single `/songs` directory, with each song's files grouped together by name but with different extensions:

### File Types
- Audio: `.mp3`
- Lyrics: `.txt`
- Image: `.jpg` or `.png`

### Project Structure
```
project-root/
├── songs/           # Contains all song files
├── demos/           # HTML demo pages
└── PROJECT_RULES.md # This documentation
```

### Example Song Files
For a song called "Stay Away the Sad Ones", the files would be:
- `songs/stay-away-the-sad-ones.mp3`
- `songs/stay-away-the-sad-ones.txt`
- `songs/stay-away-the-sad-ones.jpg`

## Automation Rules

### File Generation
1. For each song:
   - MP3 file in `/songs`
   - TXT file in `/songs`
   - Image file in `/songs`
   - Card will be automatically generated in `demos/index.html`

2. All files for a song must share the same base name with different extensions:
   - Example: `stay-away-the-sad-ones.mp3`, `stay-away-the-sad-ones.txt`, `stay-away-the-sad-ones.jpg`

### Update Process
1. Add all song files to the `songs` directory
2. Run automation script to:
   - Generate/update song cards in index.html
   - Verify file naming and extension consistency
   - Check for missing components

### File Formats

#### Lyrics File Format (TXT)
```markdown
# Song Title

## Credits
Writer: [Name]
Producer: [Name]

## Lyrics

[Verse 1]
Lyrics here...

[Chorus]
Lyrics here...
```

## Best Practices
1. Keep file names lowercase and use hyphens
2. Maintain consistent formatting in lyrics files
3. Use high-quality images (minimum 800x800 pixels)
4. Keep MP3 files under 10MB each

## Troubleshooting
- Missing song card: Check file naming consistency
- Broken audio: Verify MP3 file format
- Missing lyrics: Check TXT file exists and is properly formatted
