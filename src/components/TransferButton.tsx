import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { formatCents } from "../utils/currency";

interface Props {
  amount: number;
  onTransfer: () => void;
  onSkip: () => void;
}

const ALLY_FALLBACK = "https://ally.com";
const AUTO_DISMISS_MS = 3000;

function openAlly() {
  // Open Ally in a new tab — never hijack the current tab
  window.open(ALLY_FALLBACK, "_blank", "noopener,noreferrer");
}

export default function TransferButton({ amount, onTransfer, onSkip }: Props) {
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  useEffect(() => {
    const timer = setTimeout(() => onSkipRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleTransfer = () => {
    onTransfer();
    openAlly();
  };

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
          <span className="transfer-amount">{formatCents(amount)}</span> added
          to your Freedom Fund.
        </p>
        <p className="transfer-cta-label">Ready to move the real money?</p>

        <motion.button
          className="transfer-btn"
          onClick={handleTransfer}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          Open Ally to Transfer →
        </motion.button>

        <button className="skip-btn" onClick={onSkip}>
          Skip for now
        </button>
      </div>
    </motion.div>
  );
}
