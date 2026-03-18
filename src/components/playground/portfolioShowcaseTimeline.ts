export type ShowcasePhase =
  | "landing"
  | "cta-click"
  | "dashboard"
  | "habits-nav-click"
  | "habit-complete"
  | "idle-before-loop";

export type ShowcaseStep = {
  at: number;
  phase: ShowcasePhase;
  cursor: {
    x: number;
    y: number;
    visible: boolean;
    pressing?: boolean;
  };
};

export const SHOWCASE_TIMELINE: ShowcaseStep[] = [
  {
    at: 0,
    phase: "landing",
    cursor: { x: 76, y: 18, visible: false },
  },
  {
    at: 1300,
    phase: "cta-click",
    cursor: { x: 77, y: 18, visible: true, pressing: true },
  },
  {
    at: 2500,
    phase: "dashboard",
    cursor: { x: 73, y: 18, visible: true },
  },
  {
    at: 4150,
    phase: "habits-nav-click",
    cursor: { x: 60, y: 18, visible: true, pressing: true },
  },
  {
    at: 5600,
    phase: "habit-complete",
    cursor: { x: 28, y: 49, visible: true, pressing: true },
  },
  {
    at: 7600,
    phase: "idle-before-loop",
    cursor: { x: 28, y: 49, visible: false },
  },
];

export const REDUCED_SHOWCASE_TIMELINE: ShowcaseStep[] = [
  {
    at: 0,
    phase: "landing",
    cursor: { x: 76, y: 18, visible: false },
  },
  {
    at: 1600,
    phase: "dashboard",
    cursor: { x: 73, y: 18, visible: false },
  },
  {
    at: 3400,
    phase: "habit-complete",
    cursor: { x: 28, y: 49, visible: false },
  },
  {
    at: 5200,
    phase: "idle-before-loop",
    cursor: { x: 28, y: 49, visible: false },
  },
];

export const getShowcaseTimeline = (reducedMotion: boolean) =>
  reducedMotion ? REDUCED_SHOWCASE_TIMELINE : SHOWCASE_TIMELINE;

export const getShowcaseLoopDuration = (reducedMotion: boolean) => {
  const timeline = getShowcaseTimeline(reducedMotion);
  return (timeline[timeline.length - 1]?.at ?? 0) + 1600;
};
