# Mritunjay Kumar — Portfolio

Dark glassmorphism portfolio with an interactive **3D particle portrait** hero (Three.js).

## Your photo

The hero loads `assets/profile.png` — a background-removed (transparent) cutout of your photo; transparent pixels are carved away so your bust floats as a 3D point cloud, with depth derived from pixel brightness.

To swap in a new photo later: background-remove it (e.g. remove.bg or `rembg`), square-crop it, and save it over `assets/profile.png`. A plain `assets/profile.jpg` also works as a fallback (near-black pixels are carved instead), and with no image at all the hero shows an "MK" monogram particle cloud. The original source image is kept at `assets/profile_src.webp`.

## Contact form → your inbox

The form posts natively (`method="POST"`) to a form-backend service. `js/contact.js` only gates that submit behind validation, so an incomplete message never leaves the page.

It posts to [FormSubmit.co](https://formsubmit.co), which needs no account and no API key.

### Setup

1. In `index.html`, set the hidden `_redirect` field to your deployed URL, e.g. `https://your-domain.com/?sent=1` — the `?sent=1` is what triggers the success banner when the visitor lands back here.
2. Deploy, then submit the form once. FormSubmit.co emails you a one-time confirmation link; click it and the form is live. Submissions then arrive at `mrt.mritunjay@gmail.com`.

Note that step 2 only works from the deployed site, not from `localhost` — FormSubmit needs a real origin to register.

Other hidden fields on the form: `_subject` sets the email subject line, `_template=table` formats the message as a table, and `_honey` is a honeypot that silently absorbs spam bots.

## Updating your resume

The navbar "Resume" button serves `assets/resume.pdf`. To publish a new version, **overwrite that file** — keep the same filename and nothing else needs changing.

It was generated from `Documents/Master Resumes/Current_master_resume/Mritunjay_AIDSE_sept2026.docx`. To regenerate after editing the Word file, open it and Save As → PDF into `assets/resume.pdf`.

Visitors download it as `Mritunjay-Kumar-Resume.pdf` (set by the `download` attribute in `index.html`), so the filename they see stays clean regardless of what you name the file on disk.

## Personalise

- **Contact details** live in the contact section of `index.html` (email, phone, GitHub, LinkedIn) and in `INBOX` at the top of `js/contact.js`.
- Colors/fonts: CSS variables at the top of `css/style.css`.

## Run locally

Just open `index.html` in a browser — no build step. (For the photo to load via `assets/profile.jpg`, serving over `http://` is more reliable than `file://`; e.g. `python -m http.server` in this folder.)

## Stack

- Vanilla HTML/CSS/JS
- [Three.js r128](https://threejs.org/) — 3D particle portrait + star field
- [GSAP 3 + ScrollTrigger](https://gsap.com/) — scroll reveals
- Fonts: Exo + Roboto Mono (Google Fonts)
- Fully responsive, keyboard-accessible, respects `prefers-reduced-motion`
