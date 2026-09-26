# UNO R4 interaction

The website opens with the product title and a loading line, then reveals the board automatically. Help is optional and separate from loading. The default stage contains the board and three corner controls.

- Left-drag a component in the exploded view to move it; releasing carries damped momentum.
- Left-drag empty space to orbit. In focused inspection, left-drag rotates the selected component's view.
- Right-drag upward to zoom in, downward to zoom out. Shift-scroll also zooms.
- Middle-drag pans. Plain scrolling assembles/disassembles the board.
- Reset restores part offsets, camera rotation, pan, zoom, and explosion progress.
- Details occupies its own column on desktop and its own bottom section on phones. The canvas resizes so the inspector never covers the board.
- Search and expand a component, then choose Find on board. The camera centers and magnifies that component, the surrounding assembly fades, an accent marker identifies it, and a readable caption confirms its name. Show all exits inspection. Assembling also exits inspection.
- Details provides assembly, camera and underside controls for touch and keyboard users. Escape closes the inspector/help and exits focus. Reduced motion disables decorative floating and inertia.

Photo references, the generated bare-board texture and its exact generation prompt are documented in reference/textures/README.md. Hidden PCB routing is reconstructed for visualization, not electrical fabrication. Runtime geometry includes true board holes, plated rings and a hollow power jack.

Validation: npm test; npm run build; npm run test:e2e. Browser tests use a production preview on port 5174; development runs on 5173. Install Chromium with npx playwright install chromium, or set PLAYWRIGHT_CHANNEL=chrome to use installed Chrome.
