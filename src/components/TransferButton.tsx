import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { formatCents } from "../utils/currency";
import { calcProjections } from "../utils/projection";
import type { ProjectionSettings, CurrencyLocale } from "../types";

interface Props {
  amount: number;
  totalSavedCents: number;
  projectionSettings: ProjectionSettings;
  currencyLocale: CurrencyLocale;
  onSkip: () => void;
}

const AUTO_DISMISS_MS = 3000;

export default function TransferButton({ amount, totalSavedCents, projectionSettings, currencyLocale, onSkip }: Props) {
  const onSkipRef = useRef(onSkip);
  useEffect(() => { onSkipRef.current = onSkip; }, [onSkip]);

  const projections = calcProjections(totalSavedCents, projectionSettings.annualRatePct, projectionSettings.horizons);

  useEffect(() => {
    const timer = setTimeout(() => onSkipRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="screen transfer-screen"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30, pointerEvents: "none" }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
    >
      <div className="transfer-content">
        <div className="transfer-checkmark">✓</div>
        <h2 className="transfer-heading">Nice skip!</h2>
        <p className="transfer-subheading">
          <span className="transfer-amount">{formatCents(amount, currencyLocale)}</span> added
          to your Freedom Fund.
        </p>

        {totalSavedCents > 0 && (
          <motion.div
            className="celebration-projections"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <span className="celebration-proj-label">
              invested at {projectionSettings.annualRatePct}% grows to
            </span>
            <div className="celebration-proj-rows">
              {projections.map((p) => (
                <div key={p.years} className="celebration-proj-row">
                  <span className="celebration-proj-years">{p.years}yr</span>
                  <span className="celebration-proj-value">{formatCents(p.valueCents, currencyLocale)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <button className="skip-btn" onClick={onSkip}>
          Done
        </button>
      </div>
    </motion.div>
  );
}
