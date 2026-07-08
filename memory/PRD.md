# InviteCraft — Product Requirements Document

## Original Problem Statement
"Build me an app where user can create a templates, invitations for events, add images, adding files, everything in a single app and the code based on the python, and frontend web technologies, free db to store using flask, django. Example: I can create/generate a wedding invite, or birthday invitation, or videos something like that."

## Architecture
- **Backend**: FastAPI (Python) at `/app/backend/server.py`, all routes under `/api`
- **Frontend**: React 19 + Vite/CRA + Tailwind + shadcn/ui at `/app/frontend/`
- **DB**: MongoDB (free/local) via Motor async driver
- **AI**: `emergentintegrations` — Claude Sonnet 4.6 for copy, Gemini 3.1 Flash Image (Nano Banana) for backgrounds
- **Auth**: JWT (email + password + bcrypt)
- **Export**: html-to-image (PNG/JPG) + jsPDF (PDF), shareable link `/i/{share_id}`

## User Personas
1. **Event host** (bride, parent, HR manager) — non-designer needing beautiful invites quickly
2. **Small studio / freelancer** — reuses templates for multiple clients

## Core Requirements (static)
- Multi-event support: wedding, birthday, baby shower, anniversary, corporate
- AI copy generation with vibe control
- AI background generation
- Preset background library per event type
- Live editor with fonts, colors, overlay
- Auto-save
- Export: PNG, JPG, PDF, shareable public link

## What's been implemented (2026-02 — MVP)
- JWT auth (register / login / me) with bcrypt
- Invitations CRUD + public share endpoint
- AI text (Claude) and AI image (Gemini Nano Banana) endpoints
- Landing page with hero, features, gallery, CTA
- Register / Login pages
- Dashboard (list, delete, share, edit)
- Template gallery with 7 curated starters across 5 event types
- Full editor: 4 tabs (Content, Design, Background, AI), live preview canvas, auto-save, color swatches, 6 font choices, overlay opacity slider
- Export dropdown: PNG / JPG / PDF, plus copy share link
- Public share view at `/i/{shareId}`
- All 18 backend tests pass; frontend flow verified end-to-end

## Backlog
### P1
- Multi-image / photo insert into canvas (photo of couple, guest of honor)
- More templates (10+ per event type)
- Duplicate invitation
- Guest list + RSVP tracking (light CRM)
- Send invites via email (Resend integration)

### P2
- Custom fonts upload / Google Fonts picker
- Team / collaborative editing
- Video invitations (short animated card via Sora 2)
- Analytics: track how many guests viewed the share link
- Payments (Stripe) for premium templates

## Next Tasks
1. Add duplicate-invitation endpoint + button
2. Photo insert (single user photo on canvas)
3. Email delivery to guest list
4. Video invite generation
