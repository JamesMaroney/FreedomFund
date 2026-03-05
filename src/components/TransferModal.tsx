import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCents } from "../utils/currency";
import type { CurrencyLocale } from "../types";

interface Props {
  isOpen: boolean;
  amountCents: number;
  bankLabel: string;
  currencyLocale: CurrencyLocale;
  onConfirm: (skipNext: boolean) => void;
  onCancel: () => void;
}

export default function TransferModal({ isOpen, amountCents, bankLabel, currencyLocale, onConfirm, onCancel }: Props) {
  const [skipNext, setSkipNext] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="transfer-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
          />
          <motion.div
            className="transfer-modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div className="transfer-modal-icon">📋</div>
            <h2 className="transfer-modal-title">Ready to transfer?</h2>
            <p className="transfer-modal-body">
              <strong>{formatCents(amountCents, currencyLocale)}</strong> has been copied to your
              clipboard. When {bankLabel} opens, paste it into the transfer amount field.
            </p>

            <label className="transfer-modal-skip-row">
              <input
                type="checkbox"
                className="transfer-modal-checkbox"
                checked={skipNext}
                onChange={(e) => setSkipNext(e.target.checked)}
              />
              <span className="transfer-modal-skip-label">Don't show this again</span>
            </label>

            <div className="transfer-modal-actions">
              <button
                className="transfer-modal-btn transfer-modal-btn--cancel"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                className="transfer-modal-btn transfer-modal-btn--ok"
                onClick={() => {
                  setSkipNext(false);
                  onConfirm(skipNext);
                }}
              >
                Open {bankLabel} →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
