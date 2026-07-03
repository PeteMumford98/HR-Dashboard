# Cartwright HR write-ups

Internal tool for the Cartwright HR lead. It turns meeting notes into formatted, guideline-checked write-ups. The HR lead reviews and edits every draft, then shares a read-only link with the employee.

Nothing reaches an employee until a person clicks Share. The AI passes are advisory.

## How it works

1. Run the meeting with Granola listening.
2. Open the person in the dashboard and paste the note (or fetch it from Granola once MCP mode is on).
3. Two Claude passes run: Haiku formats the note into the standard template, then Sonnet reviews it against the guidelines table and returns flags.
4. The result lands as a draft. Review the flags, edit, save.
5. Click Share to create a signed, expiring link. Revoke it any time.

## Stack

- Next.js (App Router) on Vercel — needs the Pro plan in production (commercial use, and the pipeline can outrun Hobby's 60 second function limit)
- Supabase — Postgres, Auth and Row Level Security
- Claude API — `claude-haiku-4-5-20251001` for formatting, `claude-sonnet-4-6` for review
- Granola — hosted MCP server at `https://mcp.granola.ai/mcp` (optional at first; paste mode works day one)

## Setup in GitHub Codespaces

1. **Create the Codespace** on this repo, then install dependencies:
   ```bash
   npm install
   ```

2. **Create a Supabase project** at supabase.com. In the SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`.

3. **Create the HR login.** In Supabase: Authentication → Users → Add user (email and password). Only invite HR staff; any signed-in user has full access by design.

4. **Set environment variables.** Copy the template and fill in the placeholders:
   ```bash
   cp .env.example .env
   ```
   You need, at minimum: the Supabase URL, anon key and service role key (Settings → API), an Anthropic API key (console.anthropic.com) and a long random `SHARE_LINK_SECRET`:
   ```bash
   openssl rand -base64 48
   ```
   Leave `GRANOLA_MODE=paste` for now.

5. **Run it:**
   ```bash
   npm run dev
   ```
   Codespaces will offer a forwarded URL. Sign in with the user from step 3.

6. **Replace the seed guidelines.** The review pass only checks what is in the `guidelines` table. Put Cartwright's real HR best practice documents in there before relying on the flags.

## Turning on Granola MCP mode

Paste mode needs no Granola wiring. When you want live fetch:

1. Granola plan: MCP works on all plans but transcript access needs Business or Enterprise. Check the data training setting is off before real review calls run through it.
2. Meetings to process must sit in the HR lead's private "My notes" space. Team space folders are not reachable over MCP.
3. Obtain an OAuth bearer token for `https://mcp.granola.ai/mcp` and set it as `GRANOLA_MCP_AUTH_TOKEN`. The token flow is browser-based OAuth; a simple path is to complete it once and store the token, refreshing when it expires. This corner is deliberately left as a placeholder — see `lib/granola.ts`.
4. Set `GRANOLA_MODE=mcp` and restart.

## Deploying to Vercel

1. Push to GitHub and import the repo in Vercel (Pro plan).
2. Add every variable from `.env` in Vercel → Settings → Environment Variables. Set `NEXT_PUBLIC_APP_URL` to the deployed URL so share links are built correctly.
3. `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-side only. Never prefix them with `NEXT_PUBLIC_`.

## Data protection notes

- Raw notes are not stored by default (`raw_note` stays null); only the finished write-up is kept.
- Share links are high-entropy tokens, hashed at rest, expiring (default 14 days) and revocable. The public page only renders write-ups whose status is `shared`.
- Every create, edit, share and revoke is written to `audit_log`.
- Before go-live: confirm a lawful basis for processing, tell staff their meeting notes may be processed by an AI tool, and check whether a DPIA is needed. Speak to whoever owns data protection at Cartwright.

## Where to tweak

| What | Where |
|---|---|
| Prompts for both passes | `lib/prompts.ts` |
| Model choice | `lib/claude.ts` |
| Write-up template sections | `FORMAT_SYSTEM_PROMPT` in `lib/prompts.ts` |
| Link expiry | `SHARE_LINK_EXPIRY_DAYS` in `.env` |
| Brand styling | `app/globals.css` (palette and type tokens at the top) |
| Granola fetch | `lib/granola.ts` |

The display face falls back to Fraunces. When you have the Awesome Serif font files, drop them in `public/fonts/` and uncomment the `@font-face` block in `app/globals.css`.
