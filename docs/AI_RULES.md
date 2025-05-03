# AI Rules and Guidelines

## Project-Specific Rules

### Code Organization
- Keep JavaScript in dedicated `.js` files
- HTML files should only contain initialization code
- Avoid inline JavaScript in HTML files

### Development Workflow
- Use WSL for server management through `app.sh`
- Test changes locally before deployment
- Follow project-specific guidelines
- Always commit changes locally to git when making modifications
- Keep `AI_RULES.md` updated with new project instructions
- Keep `ARCHITECTURE.md` updated with system architecture changes

### File Formats
- Lyrics files must follow the format:
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

### Best Practices
- Keep file names lowercase with hyphens
- Use consistent formatting in all files
- Document all major changes and decisions
- Maintain clear separation of concerns in code
- Maintain consistent file structure across projects
- Keep all documentation in the `docs/` directory
- Use markdown format for all documentation files
- Maintain consistent naming conventions
