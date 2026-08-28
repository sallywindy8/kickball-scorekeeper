# Kickball Score Keeper

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deployment (GitHub Pages)

This repo deploys to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`. Enable it once in the GitHub repo: **Settings → Pages → Source: GitHub Actions**. The site is served at `https://<user>.github.io/<repo-name>/` — the workflow sets the Vite base path automatically from the repository name.
