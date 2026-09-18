# Special Deck v2

A fan-made Clash Royale deck builder focused on maxed-card collections.

## Features
- MAX/owned card collection saved in browser localStorage
- 8-card deck builder
- Balanced, Cycle, Control, Beatdown and Bridge Spam generation modes
- Role-aware deck scoring
- Attack / Defense / Air Defense / Cycle analysis
- Save and reload decks locally
- Copy Deck link and Clash Royale deep-link opening
- Responsive React/Vite frontend
- Express backend with health and deck-link API
- GitHub Actions build artifact

## Run
```bash
npm install
npm run dev
```

Production:
```bash
npm run build
npm start
```

## Important
Clash Royale deep links and card IDs are controlled by the game. The project uses the documented `clashroyale-inbox://copyDeck?deck=...` format for Copy Deck and should be rechecked after major game updates.

The remote community card-data URL is used when available; the included fallback dataset keeps the site functional if that URL is unavailable.
