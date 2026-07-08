# Current State — 2026-07-08

## What's live
The front page is the **Operator's Room**: a walkable first-person 3D
mission-control room inside Alexander's head (React Three Fiber, no drei).
Flow: hero video (tap/scroll to dive) → game spawn (cover, drop-in, beam,
welcome line) → free roam. The quickstart screen over the center console is
the only doorway to the five content sections (What I Do, Projects, Work
Experience, Who Is This Guy?, Get In Touch). Six persona zones dress the
room: Psychology, Growth, Training, Entrepreneurship (iceKore barrel tub),
AI Lab (telemetry screen, DAILY DRIVERS rail, fleet hologram), Living.
Old-man caricature bottom-right (speech bubble) links to /classic.

## Controls
- Desktop: arrows walk/turn (tank), drag to look, double-click floor to
  travel. A/D strafe.
- Touch: joystick (y walks, x turns, quadratic response), drag to look.
  Portrait spawns further back so the quickstart fits. Panels fullscreen.
- ?brain=1 deep-links into the room; ?touch=1 forces touch UI; ?reduced=1
  forces reduced motion (no drop/beam/bob).

## Recent fixes (this deploy)
- Hero freeze on phones: main video fully preloaded as a blob + the room
  prewarms (hidden) from the moment the dive starts; stall watchdog fades
  out instead of hanging.
- Spawn: opaque cover from first paint, Fortnite-style drop + light beam.
- Walk feel: head bob/sway, fov kick, 0.6m wall clearance.
- Screens repainted at 2x + dpr cap 2 (crisp on phones), bigger text.

## Gotchas for the next session
- Turbopack dev server NEVER hot-reloads globals.css: rm -rf .next +
  restart, then verify via document.styleSheets.
- Headless preview: rAF is dead — drive frames with window.__brainStep(n);
  never .remove() React-managed overlay nodes (hide via style.display).
- Full architecture history + verification ritual lives in Claude's
  project memory (frontpage-architecture).

## Next
- Owner re-test on phone: hero dive (freeze should be gone), joystick feel.
- If dive still hiccups: re-encode hero-video.mp4 below ~4 Mbps.
- Real logo files for iceKore/RødGlød/FCN/MiL/TV2/Heroic still pending
  (wordmark plaques stand in; drop files in public/brain-assets).
