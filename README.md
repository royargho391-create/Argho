# Argho — full-stack website

A responsive, dark/lime-green Argho landing website with an Express API and SQLite database.

## Included
- Responsive mobile/desktop frontend
- Working internal navigation and CTA links
- Accessible FAQ accordions
- Animated intro, reveal-on-scroll motion, optional synthesized ambience
- Newsletter signup API (`POST /api/newsletter`)
- Contact form API (`POST /api/contact`)
- SQLite persistence in `data/argho.sqlite`
- Basic validation, duplicate-email handling, Helmet security headers

## Requirements
- Node.js 20 or newer
- npm

## Run locally
```bash
npm install
npm start
```
Open http://localhost:3000

## API
- `GET /api/health` — server status
- `POST /api/newsletter` — JSON body: `{ "email": "you@example.com" }`
- `POST /api/contact` — JSON body: `{ "name": "Your name", "email": "you@example.com", "message": "Hello" }`

The forms save records in a local SQLite database. The contact endpoint stores messages; it does not email them to you automatically. To receive email notifications, connect an email provider such as Resend or SMTP and set environment variables on your hosting platform.

## Deploy
Deploy to a Node.js host that supports persistent disk storage (for SQLite), such as a suitable VPS or a platform with persistent volumes. Set the start command to `npm start`. If your host uses an ephemeral filesystem, use a managed database instead of local SQLite.

## Important
This is an original Argho design inspired by a modern dark creative-agency style, not a copy of another site's proprietary source. Review the content and privacy policy before collecting real visitor information.
