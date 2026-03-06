# Manager Dashboard

A private manager dashboard for tracking your team, 1:1s, and interview candidates. Built with Vite + React + TypeScript + Tailwind CSS + Recharts.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173/manager-dashboard](http://localhost:5173/manager-dashboard)

## Updating data

All data lives in the `data/` folder as plain JSON files. Edit them directly:

| File | What it tracks |
|---|---|
| `data/team.json` | Team members, roles, levels, compensation history |
| `data/one_on_ones.json` | 1:1 meeting notes and next steps |
| `data/candidates.json` | Interview candidates and round-by-round notes |

After editing, push to GitHub and deploy:

```bash
git add .
git commit -m "update data"
git push
npm run deploy
```

## Deploying to GitHub Pages

The app is configured to deploy to GitHub Pages:

```bash
npm run deploy
```

This builds the app and pushes the `dist/` folder to the `gh-pages` branch.

Make sure GitHub Pages is enabled in your repo settings (Settings > Pages > Branch: `gh-pages`).

## Tech stack

- **Vite** — fast dev server and build tool
- **React + TypeScript** — UI framework
- **Tailwind CSS v4** — utility-first styling
- **Recharts** — charts and sparklines
- **React Router** — client-side routing
- **gh-pages** — one-command deployment
