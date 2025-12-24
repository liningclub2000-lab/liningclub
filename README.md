# Landing page — conversion-focused

This branch adds a conversion-oriented single-page landing.

What I fixed/added in this update:
- Improved form handling: client-side validation, disabled submit while posting, friendly messages and aria-live region.
- Accessibility improvements: canonical, theme-color, JSON-LD Organization, landmarks, aria attributes, visible focus styles.
- Small CSS tweaks for focus and form messages.
- JS: safer submit flow and better error handling.

How to test locally:
1. git fetch origin
2. git checkout add-landing-conversion
3. Serve files locally: python -m http.server 8000
4. Open http://localhost:8000/landing.html

Next steps you should do after merging:
- Replace the Formspree placeholder in landing.html (action="https://formspree.io/f/your-id") with your Formspree ID.
- Upload your logo and hero/og images to /assets/ and update paths (logo at /assets/logo.png, hero image at /assets/hero-800.jpg, og image at /assets/og-image.jpg).
- (Optional) Add GA4 measurement ID if you want analytics; I can add tracking after you provide G-XXXX.

Please review the PR and if everything looks good approve and merge. If you want I can also deploy to Netlify (you will need to connect the repo yourself) or provide the Netlify deploy steps.
