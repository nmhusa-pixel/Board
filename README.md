# Anesthesia Board Review PWA

This folder is a static Progressive Web App generated from the provided EPUB source.

## Contents

- `index.html` - app entry point with the front-page install button
- `app.js` - quiz behavior, filters, study/exam mode, progress tracking
- `questions.js` - 2000-question browser-ready question bank
- `question-bank.json` - same 2000 questions as JSON for import/export
- `manifest.webmanifest` - PWA metadata for Android, iOS-compatible home screen use, and desktop
- `service-worker.js` - offline cache support
- `icons/` - app icons
- `source-map-summary.json` - generation summary by category and difficulty

## Local Preview

The preview server is currently available at:

`http://127.0.0.1:4180/index.html`

For a fresh local preview from this folder:

```powershell
python -m http.server 4180 --bind 127.0.0.1
```

## Deployment

Deploy all files in this folder to any static host, such as Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3, or a conventional web server. The app should be served over HTTPS in production so service worker caching and install behavior work reliably.

For native app-store packaging, use this web app as the source for a PWA wrapper such as Capacitor.
