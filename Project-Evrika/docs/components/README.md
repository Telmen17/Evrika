# Components index

All React components live under [`src/components/`](../../src/components/).

| Component | Responsibility | Styling | Doc |
|-----------|----------------|---------|-----|
| `LandingPage` | Hero, preview, journey map, desktop gate | CSS | [landing.md](landing.md) |
| `LandingBackground` | Parallax landing backdrop | CSS | [landing.md](landing.md) |
| `LandingDesktopGate` | Mobile “best on desktop” sticky banner | CSS | [landing.md](landing.md) |
| `LandingArchimedesRive` | Rive idle hero animation | CSS | [landing.md](landing.md) |
| `LandingArchimedesPartsIdle` | Static fallback if Rive fails | CSS | [landing.md](landing.md) |
| `ExplorationHub` | Workshop shell + room router | CSS | [hub.md](hub.md) |
| `HubOnboardingGuide` | First-visit hub tour | CSS | [hub.md](hub.md) |
| `HubAmbientMusic` | Hub background loop | — | [audio.md](audio.md) |
| `ArchimedesCompanion` | Insight bubble + voicelines | CSS | [hub.md](hub.md) |
| `EurekaShareCard` | Dev share card export | CSS | [hub.md](hub.md) |
| `FeedbackModal` | Anonymous learner feedback | **Tailwind** | [feedback.md](feedback.md) |
| `FeedbackInbox` | Dev local feedback viewer | **Tailwind** | [feedback.md](feedback.md) |
| `GlobalAudioToggle` | Mute control (non-landing) | **Tailwind** | [audio.md](audio.md) |
| `LeafFrameDecoration` | Decorative vine frame | CSS | [hub.md](hub.md) |
| `CrownWeighScene` | Balance-beam Matter.js lab | CSS | [scenes/crown-weigh.md](scenes/crown-weigh.md) |
| `CrownMeltScene` | Furnace + guard quiz | CSS | [scenes/crown-melt.md](scenes/crown-melt.md) |
| `WaterDiscoveryScene` | Water tank buoyancy lab | CSS | [scenes/water-discovery.md](scenes/water-discovery.md) |
| `DisplacementLabScene` | Overflow comparison | CSS | [scenes/displacement-lab.md](scenes/displacement-lab.md) |
| `WaterLabArchimedesOverlay` | Water lab mentor overlay | CSS | [scenes/water-discovery.md](scenes/water-discovery.md) |
| `StoryIntroScene` | Cinematic intro | CSS | [scenes/story-intro.md](scenes/story-intro.md) |
| `StoryBathScene` | Eureka bath cutscene | CSS | [scenes/story-bath.md](scenes/story-bath.md) |
| `StoryFinaleScene` | Throne finale | CSS | [scenes/story-finale.md](scenes/story-finale.md) |
| `ArchimedesRoomScene` | Archimedes study / proof | CSS | [scenes/archimedes-room.md](scenes/archimedes-room.md) |
| `BuoyancyBathScene` | Legacy buoyancy lesson | CSS | [scenes/buoyancy-bath.md](scenes/buoyancy-bath.md) |
| `CrownDensityScene` | Crown density lesson | CSS | [scenes/crown-density.md](scenes/crown-density.md) |
| `PracticeProblemsScreen` | Practice problems | CSS | [scenes/practice-problems.md](scenes/practice-problems.md) |
| `RecapScreen` | Lesson recap | CSS | [scenes/recap.md](scenes/recap.md) |
| `ProofScrollWithLock` | Locked proof scroll UI | CSS | [scenes/archimedes-room.md](scenes/archimedes-room.md) |
| `Three/BathSceneCanvas` | Three.js bath preview | CSS | [scenes/three-canvas.md](scenes/three-canvas.md) |
| `Three/CrownSceneCanvas` | Three.js crown preview | CSS | [scenes/three-canvas.md](scenes/three-canvas.md) |

**Styling column:** CSS = feature stylesheet; **Tailwind** = utilities in TSX (may still use animation CSS).

## Doc template

Each component page includes: **Purpose**, **Key files**, **Styling**, **State & progress**, **Navigation**, **Tests**, **Not testable**.

Styling reference: [styles/tailwind.md](../styles/tailwind.md)
