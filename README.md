# UNO R4 — Inside the board

An independent interactive Arduino visualization by **jose acuno dev**.

Live: https://arduino-uno-r4-explorer.vercel.app/

## Development

Node.js 22.x (22.12 or newer). Run `npm ci`, then `npm run dev`.
Production build: `npm run build`. Preview: `npm run preview`.
Checks: `npm test` and `npm run test:e2e` (install a Playwright browser first, or set `PLAYWRIGHT_CHANNEL=chrome`).

## Experience

Left-drag a component to move it; left-drag empty space to orbit. Right-drag vertically to zoom; middle-drag to pan. Scroll to assemble or disassemble. Touch supports one-finger drag, two-finger pinch, and an assembly button. Details provides searchable parts, component isolation, specifications, keyboard-accessible assembly and camera controls, and credits.

## Performance and deployment

The scene renders on demand and stops after transitions settle. Pixel density is capped on mobile. The CAD model uses lossless Meshopt compression, retaining vertex values and triangle winding. Regenerate CAD first with `scripts/convert-cad.mjs`, then run `node scripts/compress-model.mjs`; the compression script verifies decoded geometry before writing.

Deploy with Vercel using the Vite preset, build command `npm run build`, and output `dist`. `vercel.json` defines production security and cache headers; local production preview applies the same security headers. No environment variables, backend, accounts, analytics, or user-data storage are required. Never commit `.vercel` or credentials.

The CSP permits local scripts and WebAssembly for the geometry decoder; inline styles are required by React Three Fiber. Remote scripts, frames, forms, plugins, and cross-origin resource requests are blocked. Portfolio integration uses a normal link, not an iframe. Fingerprinted assets cache immutably; model and texture URLs revalidate on each visit to avoid stale releases.

## Attribution

Interface and development: **jose acuno dev**. Original hardware design: Arduino. This project is not affiliated with Arduino. See `reference/cad/README.md` for CAD provenance and `reference/textures/README.md` for photography and reconstructed texture notes. The visualization is not fabrication data. DM Sans is self-hosted under the SIL Open Font License included in its package.
