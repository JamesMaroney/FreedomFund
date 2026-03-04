import { memo } from "react";
import { motion } from "framer-motion";

interface Ring {
  /** 0–1+ progress. Values > 1 cause the ring to "lap" */
  progress: number;
  color: string;
  trackColor: string;
  label: string;
  valueLabel: string;
}

interface Props {
  rings: Ring[];
  size?: number;
  gap?: number;
  disableAnimation?: boolean;
}

const TAU = Math.PI * 2;
const START_ANGLE = -Math.PI / 2; // 12 o'clock

// ─── Geometry helpers ────────────────────────────────────────────────────────

/** Point on a circle at a given 0-1 progress fraction */
function pointAt(cx: number, cy: number, r: number, progress: number) {
  const angle = START_ANGLE + TAU * (progress % 1 || (progress >= 1 ? 1 : 0));
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/** Outward unit normal at a point on the circle */
function normalAt(cx: number, cy: number, pt: { x: number; y: number }) {
  const len = Math.hypot(pt.x - cx, pt.y - cy);
  return { nx: (pt.x - cx) / len, ny: (pt.y - cy) / len };
}

// ─── Component ───────────────────────────────────────────────────────────────

const TRACK_W = 3; // px — background track
const TRAIL_W = 2; // px — arc trail
const HEAD_R = 5; // px — glowing head dot radius
const SPIKE_COUNT = 8;
const SPIKE_INNER = 7; // px from centre of head
const SPIKE_OUTER = 14; // px from centre of head
const LAP_RING_GAP = 4; // px between active ring centre and each completion ring centre

function ActivityRings({
  rings,
  size = 260,
  gap = 14,
  disableAnimation = false,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;

  const instant = { duration: 0 } as const;

  // Space rings evenly: outermost first
  // Each ring needs room for track + head burst; use gap between ring centres
  const ringSpacing = HEAD_R * 2 + gap;
  const outerRadius = size / 2 - HEAD_R - 4;
  const radii = rings.map((_, i) => outerRadius - i * ringSpacing);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        {rings.map((_ring, i) => (
          <filter
            key={i}
            id={`glow-${i}`}
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>

      {rings.map((ring, i) => {
        const r = radii[i];
        const circumference = TAU * r;
        const laps = Math.floor(ring.progress);
        const fraction = ring.progress % 1;
        // What fraction does the animated arc show?
        const arcFraction = fraction === 0 && ring.progress >= 1 ? 1 : fraction;
        const showBurst = ring.progress > 0.015;
        const head = pointAt(cx, cy, r, ring.progress);
        const { nx, ny } = normalAt(cx, cy, head);

        return (
          <g key={i}>
            {/* ── Track ── */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={ring.trackColor}
              strokeWidth={TRACK_W}
            />

            {/* ── Completion rings — one per lap, stacked outward (max 3) ── */}
            <g key="lap-rings">
              {Array.from({ length: Math.min(laps, 3) }, (_, lap) => {
                const lapR = r + LAP_RING_GAP * (lap + 1);
                const lapCircumference = TAU * lapR;
                return (
                  <motion.circle
                    key={`lap-${lap}`}
                    cx={cx}
                    cy={cy}
                    r={lapR}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={TRAIL_W}
                    strokeLinecap="butt"
                    strokeDasharray={lapCircumference}
                    transform={`rotate(-90 ${cx} ${cy})`}
                    filter={`url(#glow-${i})`}
                    initial={{ strokeDashoffset: lapCircumference }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={
                      disableAnimation
                        ? instant
                        : {
                            duration: 1.0,
                            ease: [0.22, 1.2, 0.36, 1],
                            delay: i * 0.1 + 0.05,
                          }
                    }
                  />
                );
              })}
            </g>

            {/* ── Animated arc trail ── */}
            <motion.circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={ring.color}
              strokeWidth={TRAIL_W}
              strokeLinecap="butt"
              strokeDasharray={circumference}
              transform={`rotate(-90 ${cx} ${cy})`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - arcFraction) }}
              transition={
                disableAnimation
                  ? instant
                  : {
                      duration: 1.1,
                      ease: [0.22, 1.2, 0.36, 1],
                      delay: i * 0.1,
                    }
              }
            />

            {/* ── Laser-burst head ── */}
            {showBurst &&
              (() => {
                // Spike lines radiate outward from the head point
                const spikes = Array.from({ length: SPIKE_COUNT }, (_, k) => {
                  // Distribute spikes around the outward normal direction
                  const spreadAngle = (TAU / SPIKE_COUNT) * k;
                  const cos = Math.cos(spreadAngle);
                  const sin = Math.sin(spreadAngle);
                  // Rotate normal by spreadAngle
                  const dx = nx * cos - ny * sin;
                  const dy = nx * sin + ny * cos;
                  return {
                    x1: head.x + dx * SPIKE_INNER,
                    y1: head.y + dy * SPIKE_INNER,
                    x2: head.x + dx * SPIKE_OUTER,
                    y2: head.y + dy * SPIKE_OUTER,
                    // Spikes aligned more with normal are longer + brighter
                    opacity: Math.max(0.15, (dx * nx + dy * ny) * 0.6 + 0.35),
                    len: Math.max(0.5, (dx * nx + dy * ny) * 0.5 + 0.6),
                  };
                });

                return (
                  <g filter={`url(#glow-${i})`}>
                    {/* Spike lines */}
                    {spikes.map((s, k) => (
                      <motion.line
                        key={k}
                        x1={head.x + (s.x1 - head.x) * 0}
                        y1={head.y + (s.y1 - head.y) * 0}
                        x2={head.x + (s.x2 - head.x) * 0}
                        y2={head.y + (s.y2 - head.y) * 0}
                        stroke={ring.color}
                        strokeWidth={1}
                        strokeLinecap="round"
                        strokeOpacity={s.opacity}
                        animate={{
                          x1: s.x1,
                          y1: s.y1,
                          x2: s.x2,
                          y2: s.y2,
                        }}
                        transition={
                          disableAnimation
                            ? instant
                            : {
                                duration: 0.45,
                                ease: "easeOut",
                                delay: i * 0.1 + 0.75,
                              }
                        }
                      />
                    ))}

                    {/* Outer glow halo */}
                    <motion.circle
                      cx={head.x}
                      cy={head.y}
                      r={0}
                      fill={ring.color}
                      fillOpacity={0.2}
                      animate={{ r: HEAD_R + 4 }}
                      transition={
                        disableAnimation
                          ? instant
                          : {
                              duration: 0.4,
                              ease: "easeOut",
                              delay: i * 0.1 + 0.7,
                            }
                      }
                    />

                    {/* Core dot */}
                    <motion.circle
                      cx={head.x}
                      cy={head.y}
                      r={0}
                      fill={ring.color}
                      animate={{ r: HEAD_R }}
                      transition={
                        disableAnimation
                          ? instant
                          : {
                              duration: 0.35,
                              ease: [0.34, 1.56, 0.64, 1],
                              delay: i * 0.1 + 0.72,
                            }
                      }
                    />
                  </g>
                );
              })()}
          </g>
        );
      })}
    </svg>
  );
}

export default memo(ActivityRings);