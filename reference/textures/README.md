# Photo surface sources

The user supplied `arduino top.webp` and `arduino bottom.webp` for this revision.

- Original top photo: `public/textures/arduino-top-reference.webp`. Upward-facing CAD component surfaces sample this image at their assembled coordinates. Those surface meshes belong to their individual interaction groups, so the markings move with the components.
- Original bottom photo: `public/textures/arduino-bottom-reference.webp`. Registered to the underside with the required horizontal mirror.
- Derived bare top PCB: `public/textures/pcb-top-bare.png`. Created with the built-in ImageGen tool from the supplied top photograph. The exact submitted prompt is saved in `pcb-top-prompt.txt`. Components were removed to avoid leaving duplicate photographed components on the exploded board.

The bare-board texture reconstructs hidden pads and routes with AI assistance. It is a visual asset, not fabrication artwork or an electrically verified layout. Component markings and the bottom image use the supplied photography directly. The supplied references' external copyright/license provenance was not provided; no new license is asserted for them.

Runtime construction adds an outlined laminate with real mounting and header holes, exposed plated mounting rings, layered board edges, and a hollow DC jack. Component pivots remain those of the Arduino CAD. These authored geometry refinements and photo registration serve visualization, not manufacturing.

Lighting uses neutral, broad studio reflections and moderate roughness. Copper pad regions receive different roughness/metalness from the solder mask. Component micrograin remains a runtime procedural material.
