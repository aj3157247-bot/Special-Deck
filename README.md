# Special Deck

A complete fan-made Clash Royale deck builder built with React + Vite + Express.

## Features
- 8-card deck builder
- Max/owned card marking
- Smart deck generation by playstyle
- Average elixir and role analysis
- Card search and rarity filters
- Copy Deck / Open Clash Royale deep-link support
- Responsive mobile/desktop UI
- Remote card constants with local fallback
- Express server ready for Render

## Run locally
```bash
npm install
npm run dev
```

Production:
```bash
npm install
npm run build
npm start
```

## Render
- Build command: `npm install && npm run build`
- Start command: `npm start`

The site is an independent fan project and is not affiliated with Supercell.
The card constants fallback is based on community-maintained Clash Royale data. For current production data, replace the remote source in `src/data/cards.js` with your licensed/approved data source or your own backend.
