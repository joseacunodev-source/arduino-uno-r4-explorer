# Release audit — 26 September 2026

Live site: https://arduino-uno-r4-explorer.vercel.app/

## Security

- npm dependency audit: **0 known vulnerabilities** after dependency installation.
- Static application; no backend, authentication, form submissions, analytics, or user-data persistence.
- Production CSP restricts scripts, fonts and connections to this origin. WebAssembly is permitted for the local geometry decoder; inline styles support the canvas layout. Script evaluation and remote scripts are not allowed.
- Verified deployed CSP, content-type protection, frame protection, referrer and permissions policies.
- Verified `/.env.local`, `/.git/config`, and `/src/App.tsx` return 404. Local deployment credentials are excluded from both Git and Vercel uploads.
- Fonts are self-hosted; the browser test confirms no external resource requests.

## Performance and interaction

- CAD payload reduced from **18,723,128 to 8,933,268 bytes** (52.3%). Compression verifies all 129 accessors, including unchanged vertex values and triangle winding.
- On-demand rendering stops when transitions settle; verified with a stable render-frame counter.
- Studio environment is captured once instead of being rebuilt for UI updates. Mobile pixel density is capped.
- Pinch zoom, one-finger manipulation, dedicated mobile assembly controls, larger touch targets, safe-area spacing, and portrait/landscape layouts.
- Details and focused component labels retain their own space. Contrast corrected for component indices, secondary text, and the accent.
- Both model download failures and lazy script failures reveal component information and a retry action.

## Validation

Production build and 4 unit tests passed. Eight browser scenarios passed across the full interaction run and targeted verification after fixes: photo/assembly/inspection, mouse controls/reset, mobile inspector/keyboard, model failure, script failure, exact assembly after dragging, CSP/fonts/idle/accessibility/credits, and touch pinch/assembly/landscape.

Automated WCAG A/AA scans found no violations in the tested desktop inspector, focused component, and mobile inspector states. Tests use Chromium with software WebGL and mobile emulation; this is not a claim of measured frame rates on every physical device or a full penetration test.

## Hosting

Vercel production project: `arduino-uno-r4-explorer`. Node.js 22.x, Vite build, static `dist` output. Deployment currently uses the authenticated Vercel CLI. Automatic GitHub deployment requires adding the GitHub login connection in the Vercel account; the project is live independently of that connection. Portfolio integration can link directly to the live URL.
