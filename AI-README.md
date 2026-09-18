# Special Deck AI

The AI deck builder scores candidate cards using role coverage, elixir balance, collection levels, and curated synergy pairs. It uses a beam-search strategy rather than selecting eight cards independently.

- If the collection contains 8+ MAX cards, the search is restricted to those MAX cards.
- Otherwise it searches the full catalog and still gives owned/MAX cards a scoring bonus.
- The final deck is constrained to include a win condition, air coverage and spells while penalizing excessive elixir or redundant roles.
- `src/deck-ai.js` is browser-safe and requires no API key.
