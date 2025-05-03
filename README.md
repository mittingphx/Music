# 🎵 Scott Mitting Music Demos

## 🧭 Table of Contents
- [About](#-about)
- [Directory Overview](#-directory-overview)
- [Preview Locally](#-preview-locally)
- [GitHub Pages Deployment](#-github-pages-deployment)
- [License](#-license)
- [Contributions](#-contributions)

---

A collection of music demos by Scott Mitting, including working drafts, AI collaborations, and production sketches. This repository is public for sharing, development, and archival purposes as part of **Six of Swords Entertainment**.

## 🌟 About

This is a minimal, visually appealing music demo player designed for free deployment on any static site platform (e.g., GitHub Pages, Netlify, Vercel). It provides an elegant way to share demos without relying on third-party streaming services.

This particular repository is dedicated to Scott Mitting’s own work under Six of Swords Entertainment. However, others are welcome to **fork this project** and adapt it for their own use.

---

## 📁 Directory Overview

- [`public/`](public/) – Contains all web-accessible files. See [public/README.md](public/README.md) for detailed documentation of the demo player and song structure.
  - `demos/` – Demo player and demo list pages
  - `songs/` – Audio files, images, and lyrics for the demo player
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) – Detailed overview of the app's internal structure and rendering flow.
- [`docs/PROJECT_GUIDELINES.md`](docs/PROJECT_GUIDELINES.md) – Setup, contribution, and collaboration guidelines.
- [`docs/AI_RULES.md`](docs/AI_RULES.md) – AI prompt-writing best practices and content handling policies for use in Windsurf and Cursor environments.
- [`docs/APP_SH_USAGE.md`](docs/APP_SH_USAGE.md) – Detailed usage guide for the `app.sh` command-line tool.

---

## 🚀 Preview Locally

You can preview the music player using the `app.sh` command-line tool:

```bash
wsl ./app.sh start
```

The command will:
- Start the development server on port 3000 with the `public` directory as the root
- Automatically open your browser to http://localhost:3000
- Check for and install any required dependencies

For more detailed usage information, see the [APP_SH_USAGE.md](docs/APP_SH_USAGE.md) documentation.

---

## 🌍 GitHub Pages Deployment

To deploy via GitHub Pages:

1. Push your changes to the `main` branch.
2. Go to your repository settings.
3. Under **Pages**, set:
   - **Source**: `main`
   - **Folder**: `/ (root)`
4. Click **Save**.

Your site will be available at:

```
https://<your-username>.github.io/<your-repo-name>/
```

---

## 📜 License

This project is distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more.

> ⚠️ **Note**: Music files, lyrics, images, and other media content within this repository belong to their respective copyright holders.
>
> These assets are **not** considered part of the open-source codebase and are **not licensed under MIT**. They are included for demonstration and reference only.

---

## 🤝 Contributions

This repository serves as an official archive and tool for Six of Swords Entertainment. Feedback is welcome, and you are free to fork and modify the code for your own demo-sharing needs.

---
