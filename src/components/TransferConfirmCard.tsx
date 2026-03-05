import { motion } from "framer-motion";
import { formatCents } from "../utils/currency";
import type { CurrencyLocale } from "../types";

interface Props {
  unsentCents: number;
  currencyLocale: CurrencyLocale;
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function TransferConfirmCard({ unsentCents, currencyLocale, onConfirm, onDismiss }: Props) {
  return (
    <motion.div
      className="transfer-confirm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="transfer-confirm-card"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      >
        <span className="transfer-confirm-icon">🏦</span>
        <p className="transfer-confirm-question">
          Did{" "}
          <span className="transfer-confirm-amount">
            {formatCents(unsentCents, currencyLocale)}
          </span>{" "}
          go through?
        </p>
        <div className="transfer-confirm-actions">
          <button
            className="transfer-confirm-btn transfer-confirm-btn--yes"
            onClick={onConfirm}
          >
            Yes, lock it in 🔒
          </button>
          <button
            className="transfer-confirm-btn transfer-confirm-btn--no"
            onClick={onDismiss}
          >
            Not yet
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
