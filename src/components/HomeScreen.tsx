import { useState, useRef, useMemo, useEffect } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import type { FreedomFundState, CurrencyLocale } from "../types";
import type { ProjectionSettings } from "../types";
import { formatCents } from "../utils/currency";
import { useStreak } from "../hooks/useStreak";
import { useIsLandscape } from "../hooks/useOrientation";
import ActivityRings from "./ActivityRings";
import DepositHistory from "./DepositHistory";
import { WEEKLY_TARGETS } from "../constants/presets";
import { calcProjections } from "../utils/projection";

interface Props {
  fundState: FreedomFundState;
  onTipYourself: () => void;
  onOpenSettings: () => void;
  installPrompt: boolean;
  onInstall: () => void;
  projectionSettings: ProjectionSettings;
  currencyLocale: CurrencyLocale;
  unsentCents: number;
  onSendToAlly: () => void;
}

// ─── Goal helpers ────────────────────────────────────────────────────────────

function getDailyProgress(deposits: FreedomFundState["deposits"]): number {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return deposits
    .filter((d) => {
      const t = new Date(d.timestamp);
      const ds = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
      return ds === todayStr;
    })
    .reduce((s, d) => s + d.amount, 0);
}

function getWeeklyProgress(deposits: FreedomFundState["deposits"]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return deposits
    .filter((d) => new Date(d.timestamp) >= startOfWeek)
    .reduce((s, d) => s + d.amount, 0);
}

function getMonthlyProgress(deposits: FreedomFundState["deposits"]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return deposits
    .filter((d) => new Date(d.timestamp) >= startOfMonth)
    .reduce((s, d) => s + d.amount, 0);
}

function getWeeklyTarget(challengeStartDate: string): number {
  const start = new Date(challengeStartDate);
  const now = new Date();
  const weekNumber = Math.floor(
    (now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  const clampedWeek = Math.min(weekNumber, WEEKLY_TARGETS.length - 1);
  return (WEEKLY_TARGETS[clampedWeek] ?? 100) * 100;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAILY_GOAL_CENTS = 1000; // $10
const MONTHLY_GOAL_CENTS = 40000; // $400

const RING_COLORS = ["#ff375f", "#f5c842", "#00d68f"];
const RING_TRACKS = [
  "rgba(255,55,95,0.15)",
  "rgba(245,200,66,0.12)",
  "rgba(0,214,143,0.12)",
];

// ─── Component ───────────────────────────────────────────────────────────────

const PANEL_COUNT = 3;

export default function HomeScreen({
  fundState,
  onTipYourself,
  onOpenSettings,
  installPrompt,
  onInstall,
  projectionSettings,
  currencyLocale,
  unsentCents,
  onSendToAlly,
}: Props) {
  const { displayStreak, depositedToday } = useStreak({
    currentStreak: fundState.currentStreak,
    lastDepositDate: fundState.lastDepositDate,
  });

  const [page, setPage] = useState(1); // 0 = projections, 1 = rings, 2 = legend
  const containerRef = useRef<HTMLDivElement>(null);
  const containerW = useRef(0); // measured at drag-start
  const x = useMotionValue(0);

  const weeklyTarget = getWeeklyTarget(fundState.challengeStartDate);
  const monthlyProg = getMonthlyProgress(fundState.deposits);
  const weeklyProg = getWeeklyProgress(fundState.deposits);
  const dailyProg = getDailyProgress(fundState.deposits);

  const rings = useMemo(
    () => [
      {
        progress: monthlyProg / MONTHLY_GOAL_CENTS,
        color: RING_COLORS[0],
        trackColor: RING_TRACKS[0],
        label: "Monthly",
        valueLabel: `${formatCents(monthlyProg, currencyLocale)} / ${formatCents(MONTHLY_GOAL_CENTS, currencyLocale)}`,
      },
      {
        progress: weeklyProg / weeklyTarget,
        color: RING_COLORS[1],
        trackColor: RING_TRACKS[1],
        label: "Weekly",
        valueLabel: `${formatCents(weeklyProg, currencyLocale)} / ${formatCents(weeklyTarget, currencyLocale)}`,
      },
      {
        progress: dailyProg / DAILY_GOAL_CENTS,
        color: RING_COLORS[2],
        trackColor: RING_TRACKS[2],
        label: "Daily",
        valueLabel: `${formatCents(dailyProg, currencyLocale)} / ${formatCents(DAILY_GOAL_CENTS, currencyLocale)}`,
      },
    ],
    [monthlyProg, weeklyProg, dailyProg, weeklyTarget, currencyLocale],
  );

  const projections = useMemo(
    () => calcProjections(fundState.totalSaved, projectionSettings.annualRatePct, projectionSettings.horizons),
    [fundState.totalSaved, projectionSettings],
  );

  const [dragLeft, setDragLeft] = useState(-(PANEL_COUNT - 1) * 300);
  const [dragRight, setDragRight] = useState(300); // allow swiping right to panel 0
  const isLandscape = useIsLandscape();
  const [suppressAnimation, setSuppressAnimation] = useState(false);
  const prevLandscapeRef = useRef(isLandscape);

  useEffect(() => {
    if (prevLandscapeRef.current === isLandscape) return;
    prevLandscapeRef.current = isLandscape;
    const t1 = setTimeout(() => setSuppressAnimation(true), 0);
    const t2 = setTimeout(() => setSuppressAnimation(false), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isLandscape]);

  // Snap to rings (page 1) on first render
  useEffect(() => {
    const w = containerRef.current?.offsetWidth || 300;
    x.set(-1 * w);
    setDragLeft(-(PANEL_COUNT - 1) * w);
    setDragRight(w);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapToPage = (target: number) => {
    const w = containerW.current || containerRef.current?.offsetWidth || 300;
    animate(x, -target * w, {
      type: "spring",
      stiffness: 380,
      damping: 36,
      mass: 0.8,
    });
    setPage(target);
  };

  const handleDragStart = () => {
    const w = containerRef.current?.offsetWidth ?? 300;
    containerW.current = w;
    setDragLeft(-(PANEL_COUNT - 1) * w);
    setDragRight(page * w);
  };

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const { offset, velocity } = info;
    let target = page;
    if (offset.x < -40 || velocity.x < -300)
      target = Math.min(page + 1, PANEL_COUNT - 1);
    if (offset.x > 40 || velocity.x > 300) target = Math.max(page - 1, 0);
    snapToPage(target);
  };

  return (
    <motion.div
      className={`screen home-screen${isLandscape ? " home-screen--landscape" : ""}${fundState.deposits.length === 0 ? " home-screen--no-history" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: 0.15 }}
    >
      {/* ── Left column (portrait: full width / landscape: left pane) ── */}
      <div className="home-main-col">
        {/* ── Top bar ── */}
        <div className="home-header">
          <button
            className="hamburger-btn"
            onClick={onOpenSettings}
            aria-label="Open settings"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <span className="app-title">FREEDOM FUND</span>
          <div style={{ width: 36 }} />
        </div>

        {/* ── Carousel viewport ── */}
        {fundState.deposits.length === 0 && <div className="home-main-col-spacer" />}
        <div className="rings-swipe-area" ref={containerRef}>
          {/* Draggable track — both panels sit side-by-side inside */}
          <motion.div
            className="rings-track rings-track--3"
            style={{ x }}
            drag="x"
            dragConstraints={{ left: dragLeft, right: dragRight }}
            dragElastic={0.12}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* ── Panel 0: Projections ── */}
            <div className="rings-panel projection-panel">
              <div className="proj-panel-header">
                <span className="proj-panel-title">INVESTED AT {projectionSettings.annualRatePct}%</span>
              </div>
              {(() => {
                const allValues = [fundState.totalSaved, ...projections.map((p) => p.valueCents)];
                const max = Math.max(...allValues, 1);
                const BAR_H = 140; // px — height of the bar track area
                const ratios = allValues.map((v) => v / max);
                // SVG curve: 4 points, evenly spaced across full width
                // We render the SVG as an overlay; x positions will use % via viewBox
                const N = allValues.length; // 4
                const svgW = 200;
                const svgH = BAR_H;
                const xs = allValues.map((_, i) => ((i + 0.5) / N) * svgW);
                const ys = ratios.map((r) => (1 - r) * svgH);
                let d = `M ${xs[0]} ${ys[0]}`;
                for (let i = 1; i < N; i++) {
                  d += ` L ${xs[i]} ${ys[i]}`;
                }
                const labels = ['today', ...projections.map((p) => `${p.years}yr`)];
                return (
                  <>
                    {/* Value row with arrows */}
                    <div className="proj-value-row">
                      {allValues.map((v, i) => (
                        <div key={i} className="proj-value-row-item">
                          <span className={`proj-bar-value${i === 0 ? ' proj-bar-value--today' : ''}`}>
                            {formatCents(v, currencyLocale)}
                          </span>
                          {i < N - 1 && <span className="proj-value-arrow">›</span>}
                        </div>
                      ))}
                    </div>
                    {/* Bar + curve area */}
                    <div className="proj-bars" style={{ height: BAR_H }}>
                      {allValues.map((_v, i) => (
                        <div key={labels[i]} className="proj-bar-col">
                          <div className="proj-bar-track">
                            <motion.div
                              className={`proj-bar-fill${i === 0 ? ' proj-bar-fill--today' : ''}`}
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: ratios[i] }}
                              transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.08 }}
                              style={{ originY: 1 }}
                            />
                          </div>
                        </div>
                      ))}
                      {/* SVG curve overlay */}
                      <svg
                        className="proj-curve-svg"
                        viewBox={`0 0 ${svgW} ${svgH}`}
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d={d} className="proj-curve-path" />
                        {xs.map((cx, i) => (
                          <circle key={i} cx={cx} cy={ys[i]} r="4" className={`proj-curve-dot${i === 0 ? ' proj-curve-dot--today' : ''}`} />
                        ))}
                      </svg>
                    </div>
                    {/* Label row */}
                    <div className="proj-label-row">
                      {labels.map((lbl) => (
                        <span key={lbl} className="proj-bar-years">{lbl}</span>
                      ))}
                    </div>
                  </>
                );
              })()}
              <span className="proj-panel-basis">based on {formatCents(fundState.totalSaved, currencyLocale)} saved</span>
            </div>
            <div className="rings-panel">
              <motion.button
                className="rings-btn"
                onClick={onTipYourself}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                aria-label="Fund yourself"
              >
                <ActivityRings
                  rings={rings}
                  size={isLandscape ? 210 : 260}
                  gap={isLandscape ? 10 : 14}
                  disableAnimation={suppressAnimation}
                />

                <div className="rings-centre">
                  <span className="rings-total-label">
                    {!isLandscape && "TOTAL SAVED"}
                  </span>
                  <motion.span
                    className="rings-total-amount"
                    key={fundState.totalSaved}
                    initial={{ scale: 1.18 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  >
                    {formatCents(fundState.totalSaved, currencyLocale)}
                  </motion.span>

                  {displayStreak > 0 && (
                    <motion.div
                      className="rings-streak"
                      animate={
                        depositedToday
                          ? {
                              scale: [1, 1.1, 1],
                              transition: { repeat: Infinity, duration: 2.2 },
                            }
                          : {}
                      }
                    >
                      <span className="rings-streak-fire">🔥</span>
                      <span className="rings-streak-count">
                        {displayStreak}
                      </span>
                    </motion.div>
                  )}

                  {!isLandscape && (
                    <span className="rings-tap-hint">TAP TO FUND</span>
                  )}
                </div>
              </motion.button>
            </div>

            {/* ── Panel 1: Legend ── */}
            <div className="rings-panel rings-legend-panel">
              {rings.map((r, i) => {
                const pct = Math.round(r.progress * 100);
                const laps = Math.floor(r.progress);
                return (
                  <div key={i} className="legend-row">
                    <div className="legend-row-left">
                      <span
                        className="legend-dot"
                        style={{
                          background: r.color,
                          boxShadow: `0 0 6px ${r.color}`,
                        }}
                      />
                      <span className="legend-name">{r.label}</span>
                    </div>
                    <div className="legend-row-right">
                      <span className="legend-value">{r.valueLabel}</span>
                      <span className="legend-pct" style={{ color: r.color }}>
                        {laps > 0 ? `${laps}× +` : ""}
                        {pct % 100}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Pip indicators */}
          <div className="rings-pips">
            {Array.from({ length: PANEL_COUNT }, (_, i) => (
              <span
                key={i}
                className={`rings-pip${page === i ? " active" : ""}`}
              />
            ))}
          </div>
        </div>

        {/* ── Transfer nudge ── */}
        {unsentCents > 0 && (
          <button className="home-transfer-nudge" onClick={onSendToAlly}>
            Transfer {formatCents(unsentCents, currencyLocale)} to Ally →
          </button>
        )}

        {fundState.deposits.length === 0 && <div className="home-main-col-spacer" />}

        {/* ── Empty state intro card ── */}
        {fundState.deposits.length === 0 && (
          <div className="empty-intro-card">
            <p className="empty-intro-desc">
              Pay yourself every time you skip an impulse purchase — and watch
              your freedom fund grow.
            </p>
            <a
              className="empty-intro-readme"
              href="https://github.com/JamesMaroney/FreedomFund#readme"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more ↗
            </a>
            {installPrompt && (
              <button className="empty-intro-install" onClick={onInstall}>
                Add to Home Screen
              </button>
            )}
          </div>
        )}

        {fundState.deposits.length === 0 && <div className="home-main-col-spacer" />}

        {/* Portrait-only history anchor (fixed bottom sheet) */}
        {!isLandscape && fundState.deposits.length > 0 && (
          <div className="history-anchor">
            <DepositHistory deposits={fundState.deposits} currencyLocale={currencyLocale} />
          </div>
        )}
      </div>

      {/* ── Right column — landscape only ── */}
      {isLandscape && fundState.deposits.length > 0 && (
        <div className="home-history-col">
          <DepositHistory deposits={fundState.deposits} currencyLocale={currencyLocale} landscape />
        </div>
      )}
    </motion.div>
  );
}
