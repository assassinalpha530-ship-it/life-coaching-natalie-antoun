# Bloom — Life Coaching Web App

A lightweight, single-page static app for Cloudflare Pages using Supabase for authentication and data.

## What is included
- Unified Client / Coach login.
- Coach dashboard with client list and worksheet review.
- Coach-created client accounts.
- Wheel of Life with 8 live sliders + radar chart.
- Gratitude Jar.
- Self-Love Worksheet.
- Responsive pastel/gold design.
- No build step: plain HTML/CSS/JS.

## 1. Supabase setup
This package is already configured for the Supabase project used during setup.

Important: the browser only contains the Supabase **publishable** key. Never put a service-role/secret key into `config.js`.

### Create the Coach account
The first Coach account must be created once in Supabase Authentication because the role is stored in secure `app_metadata`.

In Supabase Dashboard:
1. Authentication → Users → Add user.
2. Create the email/password account you want for the Coach.
3. In the user's details, set App Metadata to:
   {"role":"coach"}
4. In Table Editor → `coach_coach_profiles`, insert a row with the same Auth user UUID:
   - id = Auth user's UUID
   - username = the username you want the Coach to type on the Bloom login page
   - display_name = coach name
   - role = coach

The Coach password is NOT stored in this website's code. You choose/change it in Supabase Authentication.

Client accounts are then created from the Coach Dashboard.

## 2. Cloudflare Pages
Create a new Pages project and upload this folder as the static site.

Build command: none
Build output directory: the folder containing `index.html`

If Cloudflare asks for a framework, choose "None".

## 3. Change branding
Edit:
- `index.html` for title/meta.
- `styles.css` for colors.
- `app.js` for labels and exercises.
- `config.js` only if you move to a different Supabase project.

## Security note
RLS is enabled on the data tables. Client rows are restricted to the signed-in client, while Coach access is based on secure Auth `app_metadata`, not editable user metadata.
