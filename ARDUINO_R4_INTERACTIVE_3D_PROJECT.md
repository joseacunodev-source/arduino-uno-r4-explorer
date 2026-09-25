# Arduino UNO R4 WiFi Interactive Exploded View Website

## Project Brief

Build a premium, interactive 3D website centered on an Arduino UNO R4 WiFi.

The opening experience must present the Arduino in a fully exploded 3D state, with major components floating in organized positions around the PCB. Users should be able to inspect and interact with the scene. As they scroll down, the components progressively move into their real locations until the board becomes fully assembled.

Scrolling upward should reverse the animation and return the board to the exploded state.

This must be implemented as a real-time 3D website, not as a pre-rendered AI video.

The experience should feel like a premium product visualization, similar in quality and restraint to high-end watch, automotive, or industrial design websites.

The final result must avoid generic AI-generated design patterns, unnecessary effects, emojis, decorative clutter, random gradients, excessive glassmorphism, and overdone motion.

---

# Core Experience

## Initial State

When the user first opens the website:

- The Arduino UNO R4 WiFi is shown in a maximum exploded 3D view.
- The PCB remains centered and acts as the anchor.
- Major components float around the PCB in clean, intentional positions.
- Components have very subtle idle motion.
- The user can drag to rotate the whole scene.
- Mouse movement can create minimal parallax.
- Hovering over selected components can slightly emphasize them.
- The camera remains controlled and cinematic.
- The scene must remain readable and uncluttered.

The opening view should immediately communicate:

- real 3D
- accurate electronics
- premium engineering
- high-end product presentation
- interactive exploration

---

# Scroll Behavior

Use scroll progress as the master animation controller.

```text
0% scroll
Fully exploded

25% scroll
Small components begin assembling

50% scroll
Main modules and processors begin assembling

75% scroll
Ports, connectors, and headers move into position

100% scroll
Fully assembled Arduino UNO R4 WiFi
```

Scrolling upward must reverse the exact same motion.

Do not use one-way animations that cannot be reversed cleanly.

Do not use random physics.

Every animated object must have a known exploded transform and assembled transform.

---

# Exploded Percentage System

Use a consistent normalized assembly model.

```text
assemblyProgress = 0.0
100% exploded

assemblyProgress = 0.25
75% exploded

assemblyProgress = 0.50
50% exploded

assemblyProgress = 0.75
25% exploded

assemblyProgress = 1.0
fully assembled
```

This progress value should control every component.

---

# Recommended Technology Stack

Use the following stack unless there is a clear technical reason to change it.

## Core

- Vite
- React
- TypeScript

## 3D

- Three.js
- @react-three/fiber
- @react-three/drei

## Animation

- GSAP
- GSAP ScrollTrigger

## Optional Utilities

- Zustand for lightweight scene/UI state if needed
- leva only during development for tuning values
- gltf-transform for GLB optimization if useful
- Draco and Meshopt where appropriate

Do not introduce large libraries unless they solve a real problem.

---

# Required Skills

Codex should treat the following as the required skill set for the project.

## Frontend Engineering

- React
- TypeScript
- component architecture
- responsive layout
- performance-conscious rendering
- semantic HTML
- accessibility

## 3D Web Development

- Three.js
- React Three Fiber
- Drei
- glTF / GLB loading
- scene graph inspection
- materials
- lighting
- camera control
- transforms
- raycasting
- pointer interaction
- responsive canvas behavior

## Animation

- GSAP
- ScrollTrigger
- interpolation
- reversible timelines
- scroll-linked animation
- easing
- motion sequencing

## 3D Asset Pipeline

- GLB / GLTF workflow
- Blender-friendly workflow
- mesh naming
- mesh grouping
- pivot placement
- object hierarchy
- texture optimization
- mesh simplification
- texture compression
- draw-call reduction

## Performance

- lazy loading
- suspense
- model preloading
- texture compression
- geometry optimization
- instancing where useful
- reduced motion
- mobile fallback
- adaptive DPR
- performance profiling

## UX

- mouse and touch interaction
- drag rotation
- hover behavior
- scroll guidance
- component focus states
- tooltips
- responsive interaction rules

---

# Model Requirement

The preferred model format is:

```text
.glb
```

The Arduino model must contain separate meshes or logical groups for important components.

Ideal scene structure:

```text
Arduino_R4_WiFi
├── PCB
├── USB_C
├── Barrel_Jack
├── Reset_Button
├── ESP32_Module
├── RA4M1_MCU
├── LED_Matrix
├── Digital_Header_A
├── Digital_Header_B
├── Power_Header
├── Analog_Header
├── Qwiic_Connector
├── SPI_Header
├── Power_Inductor
├── Regulators
├── Power_Components
├── SMD_Group_A
├── SMD_Group_B
└── SMD_Group_C
```

If the imported model is a single merged mesh, inspect it before proceeding.

If practical, split or prepare the model in Blender first.

Do not fake object separation with image tricks if actual geometry is available.

---

# Component Strategy

Do not animate every microscopic resistor independently.

That would create unnecessary complexity and poor performance.

Use individual meshes for visually important parts.

## Animate Individually

- PCB
- USB-C connector
- DC barrel jack
- reset button
- ESP32-S3 module
- Renesas RA4M1 MCU
- LED matrix
- digital headers
- power header
- analog header
- SPI / ICSP header
- Qwiic connector
- large inductor
- major regulators
- visually important ICs

## Group Small Components

Group nearby small components into logical clusters.

Examples:

```text
SMD_USB_REGION
SMD_POWER_REGION
SMD_MCU_REGION
SMD_WIFI_REGION
SMD_ANALOG_REGION
```

Target approximately 20 to 40 animated objects.

This keeps the scene visually rich without creating unnecessary overhead.

---

# Component Transform Data

Every animated part should have:

- assembled position
- assembled rotation
- assembled scale
- exploded position
- exploded rotation
- exploded scale
- optional idle offset
- optional hover offset
- animation group
- assembly order

Example:

```ts
export type PartConfig = {
  name: string
  objectName: string

  assembled: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale?: [number, number, number]
  }

  exploded: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale?: [number, number, number]
  }

  assemblyRange: [number, number]

  idleAmplitude?: number
  hoverOffset?: [number, number, number]
}
```

Example data:

```ts
export const parts: PartConfig[] = [
  {
    name: "ESP32-S3",
    objectName: "ESP32_Module",
    assembled: {
      position: [-0.7, 0.1, 0.15],
      rotation: [0, 0, 0]
    },
    exploded: {
      position: [-2.0, 1.6, 2.4],
      rotation: [0, 0, 0]
    },
    assemblyRange: [0.45, 0.70],
    idleAmplitude: 0.03
  },

  {
    name: "Renesas RA4M1",
    objectName: "RA4M1_MCU",
    assembled: {
      position: [0.85, 0.2, 0.2],
      rotation: [0, 0, 0]
    },
    exploded: {
      position: [1.9, 1.8, 2.7],
      rotation: [0, 0, 0]
    },
    assemblyRange: [0.45, 0.70],
    idleAmplitude: 0.025
  },

  {
    name: "USB-C",
    objectName: "USB_C",
    assembled: {
      position: [-1.65, 0.0, 0.15],
      rotation: [0, 0, 0]
    },
    exploded: {
      position: [-3.0, 0.5, 1.1],
      rotation: [0, 0, 0]
    },
    assemblyRange: [0.70, 0.90]
  }
]
```

Exact positions must be tuned from the real model, not guessed permanently.

---

# Exploded Layout Rules

The PCB must remain fixed.

The exploded state should be maximum but organized.

Use depth in all three axes.

Do not simply move everything vertically upward.

The scene should feel intentionally composed.

## Large Components

Move furthest from the PCB.

Suggested visual distance:

```text
40 to 75 mm equivalent
```

Examples:

- long headers
- ESP32 module
- Renesas MCU
- barrel jack
- USB-C connector

## Medium Components

Suggested visual distance:

```text
20 to 45 mm equivalent
```

Examples:

- reset button
- SPI header
- Qwiic connector
- regulators
- large inductor

## Small Components

Suggested visual distance:

```text
5 to 20 mm equivalent
```

Examples:

- SMD clusters
- small capacitors
- small resistors
- tiny IC groups

---

# Maximum Exploded View Composition

The opening state should feel more like a true three-dimensional exploded engineering render than a flat diagram.

Use:

- clear Z-depth
- lateral separation
- readable spacing
- component hierarchy
- asymmetrical but balanced composition
- no collisions
- no visual tangles

The board should be tilted slightly toward the viewer.

The USB-C / power side can be closer to the camera.

Use a premium three-quarter camera angle.

Do not use an extreme wide-angle lens.

Recommended starting camera feel:

```text
equivalent lens: 60mm to 85mm
camera elevation: 25° to 35°
camera azimuth: 35° to 45°
```

Tune to fit the actual model.

---

# Interaction

## Drag Rotation

Allow the user to drag the overall Arduino scene.

Desktop:

```text
click + drag
```

Mobile:

```text
touch + drag
```

Keep rotation constrained.

Do not allow the board to flip upside down or become disorienting.

Example constraints:

```text
yaw: approximately ±20°
pitch: approximately ±10°
```

The scroll-driven assembly must still work regardless of drag rotation.

---

# Mouse Parallax

Use only subtle parallax.

The effect should be barely noticeable.

Do not make the board chase the cursor.

Suggested maximum scene offset:

```text
x: ±0.08
y: ±0.05
```

Use eased interpolation.

---

# Idle Floating

At the top of the page, exploded components may float subtly.

Example:

```ts
const floatingOffset =
  Math.sin(time * speed + phase) * amplitude
```

Recommended amplitude:

```text
0.01 to 0.04 world units
```

Different parts should have slightly different phase values.

Do not use large motion.

Do not use random repositioning.

As the user scrolls, reduce idle movement.

Example:

```text
assemblyProgress = 0.0
idle intensity = 100%

assemblyProgress = 0.2
idle intensity = 60%

assemblyProgress = 0.4
idle intensity = 20%

assemblyProgress >= 0.5
idle intensity = 0%
```

---

# Hover Interaction

Only major components should be individually hoverable.

Examples:

- ESP32
- RA4M1
- USB-C
- barrel jack
- LED matrix
- main headers

On hover:

- slight positional offset
- subtle material response
- optional small label
- cursor change

Do not make components glow neon.

Do not add heavy outlines.

Do not scale parts aggressively.

Keep the response refined.

---

# Optional Component Labels

Labels should only appear when useful.

Example:

```text
RENESAS RA4M1
32-bit Arm Cortex-M4 MCU
```

```text
ESP32-S3
Wi-Fi + Bluetooth
```

```text
12 × 8 LED MATRIX
96 LEDs
```

Labels should use restrained typography and thin leader lines only if necessary.

Do not permanently cover the 3D scene with text.

---

# Animation Sequence

## Stage 1 — 0% to 15%

Maximum exploded presentation.

- PCB fixed
- all major components separated
- subtle idle motion
- user can inspect
- no major assembly yet

## Stage 2 — 15% to 35%

Small components begin moving into place.

- SMD groups
- small regulators
- support components
- small IC clusters

## Stage 3 — 35% to 60%

Major functional groups assemble.

- LED matrix
- power components
- medium ICs
- ESP32 module
- RA4M1 MCU

## Stage 4 — 60% to 85%

Mechanical connectors assemble.

- USB-C
- barrel jack
- Qwiic
- SPI header
- reset button
- header strips

## Stage 5 — 85% to 100%

Final seating.

- all parts align
- motion becomes slower
- everything reaches exact transforms
- idle motion becomes zero

At 100%, the Arduino must be completely assembled.

---

# Scroll Interpolation

Use deterministic interpolation.

Example:

```ts
function remap(
  value: number,
  inputStart: number,
  inputEnd: number
) {
  return THREE.MathUtils.clamp(
    (value - inputStart) / (inputEnd - inputStart),
    0,
    1
  )
}
```

Each part can have its own assembly window.

Example:

```ts
const localProgress = remap(
  assemblyProgress,
  part.assemblyRange[0],
  part.assemblyRange[1]
)
```

Then interpolate:

```ts
mesh.position.lerpVectors(
  explodedPosition,
  assembledPosition,
  localProgress
)
```

Use quaternion interpolation for rotations when needed.

---

# GSAP Strategy

Use ScrollTrigger to control one normalized progress value.

Avoid creating dozens of unrelated scroll triggers.

Preferred architecture:

```text
ScrollTrigger
    ↓
global assembly progress
    ↓
ArduinoScene
    ↓
individual parts calculate local progress
```

This makes reverse scrolling reliable.

---

# Visual Direction

The site must look premium and technical.

Avoid template-style SaaS visuals.

## Desired Style

- dark or neutral premium interface
- strong typography
- large whitespace
- precise alignment
- restrained motion
- cinematic 3D
- industrial design language
- subtle technical detailing
- minimal UI chrome

## Avoid

- emoji
- decorative icon spam
- generic gradients
- purple AI gradients
- glowing blobs
- excessive glassmorphism
- excessive rounded cards
- fake terminal windows
- random HUD overlays
- unnecessary noise
- floating badges
- decorative dots everywhere
- meaningless charts
- fake metrics
- typewriter effects
- bouncing buttons
- excessive shadows
- unnecessary pill buttons
- exaggerated blur
- excessive scroll animations
- generic startup landing page patterns

Every visual element must have a reason to exist.

---

# Typography

Use a premium modern sans-serif.

Good options:

- Inter
- Geist
- Manrope
- IBM Plex Sans
- Sora
- Instrument Sans

Use one primary family unless a second family has a clear purpose.

Recommended hierarchy:

```text
Display heading
48–96px desktop

Section heading
32–56px

Body
16–18px

Technical labels
11–14px
```

Avoid excessive uppercase text.

Use uppercase only for small technical labels where appropriate.

---

# Color Direction

Keep the interface restrained.

Example system:

```text
Background
#0A0A0A

Surface
#111111

Primary text
#F5F5F5

Secondary text
#A6A6A6

Borders
rgba(255,255,255,0.08)

Arduino blue accent
sample from the actual PCB/model
```

Do not use many accent colors.

Let the Arduino itself provide most of the visual color.

---

# Suggested Page Structure

```text
01 Hero / Exploded Arduino
02 Assembly Scroll Sequence
03 Architecture / Major Components
04 Component Detail
05 Technical Specifications
06 Interactive Explore
07 Final Product State
```

The first two sections are the priority.

Do not build unnecessary sections before the core 3D interaction works.

---

# Hero Section

The hero should be mostly visual.

Possible text:

```text
ARDUINO UNO R4 WIFI

Inside the board.
```

or

```text
ARDUINO UNO R4 WIFI

Explore every layer.
```

Keep copy minimal.

Do not use marketing filler.

Do not add fake testimonials or fake metrics.

A small instruction may appear:

```text
Scroll to assemble
```

No emoji.

---

# Scene Lighting

Use realistic product lighting.

Suggested setup:

- one large key light
- soft fill
- subtle rim light
- environment light only if it improves materials

Do not overlight.

Do not make metal surfaces pure white.

Do not create neon glow.

Use physically plausible materials.

---

# Model Materials

Preserve the real model's materials where possible.

Target:

## PCB

- deep blue solder mask
- subtle roughness
- white silkscreen
- realistic copper/gold contacts

## Metal

- realistic roughness
- no mirror-like chrome unless correct

## Black Plastic

- slightly rough
- not fully matte
- subtle specular highlights

## Gold Pins

- metallic
- controlled reflections

---

# Background

For the main website, use a clean neutral environment.

Preferred options:

```text
#0A0A0A
```

or

```text
#F0F0EE
```

Choose one direction and remain consistent.

Do not add a busy 3D environment behind the board.

---

# Responsive Behavior

## Desktop

Full experience:

- exploded 3D
- drag rotation
- hover interaction
- scroll assembly
- labels
- full detail

## Tablet

Reduce:

- parallax strength
- hover effects
- render resolution if needed

Keep:

- drag
- scroll assembly

## Mobile

Prioritize performance.

Possible changes:

- lower DPR
- fewer shadows
- lower texture size
- simplified small component groups
- limited rotation
- no hover
- touch drag
- scroll assembly

The core experience must still work.

---

# Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

For reduced motion:

- disable idle floating
- disable parallax
- reduce scene transitions
- preserve scroll state changes in a simplified form

---

# Performance Targets

Aim for:

```text
Desktop
60 FPS target

Modern mobile
30–60 FPS target
```

Keep initial download reasonable.

Suggested targets:

```text
GLB after optimization
ideally under 10–15 MB

Individual textures
prefer 1K–2K unless a 4K texture is visibly necessary
```

Do not ship 4K textures for tiny components.

---

# Performance Checklist

Codex must inspect:

- GLB size
- triangle count
- material count
- texture count
- texture resolution
- draw calls
- shadow cost
- DPR
- post-processing cost

Optimize before adding visual effects.

Potential techniques:

- merge static geometry
- group small parts
- instance repeated LED elements
- instance repeated pins if possible
- use Meshopt
- use Draco where appropriate
- use KTX2 textures where appropriate
- preload the GLB
- lazy-load non-critical sections

---

# Loading Experience

Do not show a generic spinner if avoidable.

Use a minimal loading screen.

Example:

```text
ARDUINO UNO R4 WIFI

LOADING MODEL
```

Optional thin progress line.

No animated robot.

No emoji.

No fake terminal output.

---

# Accessibility

The website must remain usable without interacting with the 3D model.

Requirements:

- semantic page structure
- keyboard-accessible UI
- readable contrast
- descriptive labels
- reduced motion support
- no important information available only through hover
- text alternative for component information

---

# Project Structure

Recommended structure:

```text
src/
├── components/
│   ├── scene/
│   │   ├── ArduinoScene.tsx
│   │   ├── ArduinoModel.tsx
│   │   ├── ArduinoPart.tsx
│   │   ├── CameraRig.tsx
│   │   ├── Lighting.tsx
│   │   ├── SceneEnvironment.tsx
│   │   └── PartLabel.tsx
│   │
│   ├── interaction/
│   │   ├── DragController.tsx
│   │   ├── PointerParallax.tsx
│   │   └── ScrollAssemblyController.tsx
│   │
│   └── ui/
│       ├── LoadingScreen.tsx
│       ├── ScrollHint.tsx
│       └── ComponentInfo.tsx
│
├── data/
│   ├── arduinoParts.ts
│   └── specs.ts
│
├── hooks/
│   ├── useAssemblyProgress.ts
│   ├── useReducedMotion.ts
│   └── useResponsiveQuality.ts
│
├── models/
│   └── arduino-r4-wifi.glb
│
├── sections/
│   ├── Hero.tsx
│   ├── AssemblySection.tsx
│   ├── ArchitectureSection.tsx
│   └── SpecificationsSection.tsx
│
├── styles/
│   └── globals.css
│
├── App.tsx
└── main.tsx
```

---

# Codex Operating Instructions

Codex should work through the project in controlled stages.

Do not attempt to build the entire site in one uncontrolled pass.

Do not rewrite unrelated working code without a reason.

Do not replace real implementations with placeholders unless explicitly marked.

Do not introduce unnecessary dependencies.

Do not add decorative features before the core 3D interaction is stable.

After every major stage:

1. run the application
2. check console errors
3. check TypeScript errors
4. verify responsive behavior
5. verify the 3D scene
6. test scroll direction both ways
7. fix issues before moving on

---

# Codex Task Plan

## Phase 1 — Repository Setup

- create Vite React TypeScript project
- install Three.js
- install React Three Fiber
- install Drei
- install GSAP
- configure project
- remove default Vite demo content
- create project folders
- create minimal premium global styles

Done when:

- project runs
- TypeScript compiles
- blank premium page loads
- no console errors

---

## Phase 2 — Load Arduino Model

- add GLB file
- load through `useGLTF`
- inspect node names
- print or document model hierarchy during development
- determine whether major components are separate meshes
- create a component map

Done when:

- model appears correctly
- camera framing is stable
- materials look correct
- no model loading errors

---

## Phase 3 — Normalize Model

- center model
- determine scale
- orient model correctly
- establish local axes
- establish assembled transforms
- freeze the PCB as the anchor

Done when:

- assembled board is correctly positioned
- board can be rendered consistently on all screen sizes

---

## Phase 4 — Build Exploded State

Create exploded transforms for each important component.

Start with:

1. PCB
2. ESP32
3. RA4M1
4. USB-C
5. barrel jack
6. main headers
7. LED matrix
8. Qwiic
9. SPI header
10. power components
11. SMD groups

Tune until the opening composition feels balanced.

Do not proceed until the exploded hero state looks strong.

---

## Phase 5 — Assembly Interpolation

Implement normalized:

```text
0 to 1
```

assembly progress.

Interpolate every part between:

```text
exploded transform
→
assembled transform
```

Ensure reverse interpolation works.

Done when manually changing assemblyProgress from 0 to 1 fully assembles the board and 1 to 0 fully explodes it.

---

## Phase 6 — Scroll Integration

Add ScrollTrigger.

Map page scroll to assemblyProgress.

Test:

- slow scroll
- fast scroll
- trackpad
- mouse wheel
- reverse scroll
- mobile touch scroll

Avoid jitter.

Avoid snapping unless intentionally designed.

---

## Phase 7 — Drag Interaction

Add constrained scene rotation.

Do not rotate individual components during drag.

Rotate a parent scene group.

Ensure drag does not conflict with page scrolling.

---

## Phase 8 — Idle Floating

Add subtle floating only to exploded parts.

Use stable deterministic sinusoidal motion.

Fade it out as assembly progresses.

Do not use randomness every frame.

---

## Phase 9 — Hover Interaction

Add hover only for major components.

On hover:

- slight offset
- pointer cursor
- optional label

Keep effects minimal.

---

## Phase 10 — Visual Polish

Add:

- final lighting
- final camera position
- typography
- hero copy
- subtle scroll indicator
- component labels
- section transitions

Do not compromise performance for polish.

---

## Phase 11 — Performance Pass

Profile.

Optimize:

- model size
- texture size
- draw calls
- shadows
- DPR
- repeated geometry
- component groups

Test desktop and mobile.

---

## Phase 12 — Accessibility

Add:

- keyboard support where relevant
- text alternatives
- reduced motion
- semantic headings
- contrast checks

---

## Phase 13 — Production Build

Run:

```bash
npm run build
```

Fix:

- TypeScript errors
- warnings
- runtime errors
- missing assets
- bad paths

Verify production build locally.

---

# Priority Order

When tradeoffs are necessary, use this order:

1. stable real-time 3D
2. accurate Arduino model
3. good exploded composition
4. smooth reversible scroll assembly
5. desktop performance
6. mobile performance
7. interaction
8. visual polish
9. secondary sections

Do not prioritize decorative effects over the core experience.

---

# Design Quality Rules

The site must not feel AI-generated.

Avoid generic filler.

Avoid arbitrary content.

Avoid unnecessary explanations on-screen.

Avoid overdesigned controls.

Avoid excessive microcopy.

Avoid visual noise.

Use:

- strong proportions
- deliberate spacing
- clean type
- restrained animation
- thoughtful camera composition
- realistic materials
- confident minimalism

If a design element does not improve usability, hierarchy, storytelling, or visual quality, remove it.

---

# Definition of Done

The project is complete when:

- a real Arduino UNO R4 WiFi GLB is loaded
- the board opens in a clearly exploded 3D state
- the user can rotate the scene
- major components are interactive
- components have subtle idle movement
- scrolling progressively assembles the board
- reverse scrolling disassembles the board
- the board becomes completely assembled at the end
- animation is smooth
- the scene works on desktop and mobile
- reduced-motion behavior exists
- visual design feels premium
- no emojis are used
- no generic AI visual patterns are used
- no console errors remain
- production build succeeds

---

# Immediate Next Step

Before building the complete site, obtain or prepare an Arduino UNO R4 WiFi 3D model.

Preferred formats:

```text
.glb
.gltf
.blend
.fbx
.obj
```

Prefer `.glb`.

Once the model is available:

1. place it in the project
2. inspect its mesh hierarchy
3. identify separable parts
4. rename important meshes if needed
5. define assembled transforms
6. define exploded transforms
7. build the first interactive prototype

Do not spend time building the final UI until the 3D model pipeline and exploded-to-assembled animation are working correctly.
