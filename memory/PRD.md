# InviteCraft — Product Requirements Document

## Original Problem Statement
An app to create/generate invitations (weddings, birthdays, baby showers, anniversaries, corporate) with templates, images, files, videos.

## Architecture
- **Backend**: FastAPI at `/app/backend/server.py`, MongoDB via Motor, all routes under `/api`
- **Frontend**: React 19 + Tailwind + shadcn/ui
- **AI**: Emergentintegrations — Claude Sonnet 4.6 (text), Gemini 3.1 Flash Image / Nano Banana (image), Sora 2 (video)
- **Storage**: Emergent Object Storage for uploaded photos, audio, and generated videos
- **Email**: Resend (API key optional — endpoint gracefully errors without it)
- **Auth**: JWT + bcrypt

## Implemented (v1 + v2)
### v1 — Feb 2026
- JWT auth, invitations CRUD, public share, 7 curated templates
- Editor: content, design (fonts/colors/overlay), background library, AI text (Claude), AI background (Gemini Nano Banana)
- Export PNG / JPG / PDF, public share link at `/i/{shareId}`

### v2 — Feb 2026
- **Photos on canvas**: curated library (temple, south indian, couple, florals) + user upload via Emergent Object Storage; drag to reposition, resize, rotate, choose shape (circle/rounded/rect)
- **Envelope styles**: Classic Paper, Shubh Vivah (gold+red), Minimal Modern — with animated flap opening
- **Falling effects layer**: rose petals, floating flowers, confetti, golden sparkles, temple bells
- **Music player**: preset library (Ambient Piano, Uplifting, Elegant Strings, Cinematic via SoundHelix) + upload MP3/WAV; autoplay muted with unmute control
- **Scratch-to-reveal** overlay on the public invite
- **Guest list**: single/bulk add, dedupe by email, per-guest send
- **RSVP tracking**: public RSVP form with yes/maybe/no + optional note; case-insensitive email matching
- **Email delivery** via Resend (graceful "not configured" error when key missing)
- **View analytics**: total views, unique IP-hashed views, views-by-day, RSVP breakdown
- **AI video (Sora 2)**: background job pattern, poll `/api/ai/video-status/{job_id}`, saved to object storage, playable on public view
- New pages: `/invite/:id/guests` (Guests & RSVP dashboard)
- 46/46 backend tests pass; frontend E2E flows verified

## Backlog
### P1
- Enable Resend once user provides API key + verified domain
- More music presets (temple bells, shehnai, sitar) via a curated CDN
- More envelope styles (kraft paper, watercolor)
- Duplicate invitation
- Guest RSVP requires email verification (magic link) for accuracy

### P2
- Text elements on canvas beyond the fixed template layout
- Multiple photos with z-order controls
- Send WhatsApp invites (Twilio) with the public URL
- Payments (Stripe) — paid premium templates + video-invite credits
- Team / collaborative editing

## Next Tasks
1. Wire Resend API key + verified sending domain
2. Add temple-bell / shehnai audio presets (host on object storage)
3. Duplicate invitation endpoint + button
4. Better mobile-responsive editor
