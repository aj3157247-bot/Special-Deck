# Special Deck V8 Cloud Accounts

Run `supabase-schema.sql` once in Supabase SQL Editor.

Set these Render environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose it as VITE_*)
- `AUTH_JWT_SECRET` (32+ random characters)

If the frontend and backend are on different domains, set `VITE_API_URL` to the backend URL before building.
