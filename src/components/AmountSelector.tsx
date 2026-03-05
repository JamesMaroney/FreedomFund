import { useState } from 'react'
import { motion } from 'framer-motion'
import type { TipPreset, CurrencyLocale } from '../types'
import { formatCents, parseDollarsToCents } from '../utils/currency'

interface Props {
  tipPresets: TipPreset[]
  currencyLocale: CurrencyLocale
  onSelect: (amount: number, label: string) => void
  onBack: () => void
}

export default function AmountSelector({ tipPresets, currencyLocale, onSelect, onBack }: Props) {
  const [customValue, setCustomValue] = useState('')
  const [customError, setCustomError] = useState('')

  const handlePreset = (amount: number, description: string) => {
    onSelect(amount, description)
  }

  const handleCustomSubmit = () => {
    const cents = parseDollarsToCents(customValue)
    if (cents <= 0) {
      setCustomError('Enter a valid amount')
      return
    }
    setCustomError('')
    onSelect(cents, `Skipped ${formatCents(cents, currencyLocale)} purchase`)
  }

  return (
    <motion.div
      className="screen amount-selector"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40, pointerEvents: 'none' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="selector-header">
        <button className="back-btn" onClick={onBack} aria-label="Cancel">✕</button>
        <h2 className="selector-title">What did you skip?</h2>
      </div>

      <p className="selector-subtitle">Tap the chip to tip yourself that amount.</p>

      <div className="preset-grid">
        {tipPresets.map((preset) => (
          <motion.button
            key={preset.id}
            className="preset-chip"
            onClick={() => handlePreset(preset.amount, preset.description)}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <span className="chip-emoji">{preset.emoji}</span>
            <span className="chip-amount">{formatCents(preset.amount, currencyLocale)}</span>
            <span className="chip-label">{preset.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="custom-amount">
        <span className="custom-dollar">$</span>
        <input
          className="custom-input"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={customValue}
          onChange={(e) => {
            setCustomValue(e.target.value)
            setCustomError('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
        />
        <motion.button
          className="custom-submit"
          onClick={handleCustomSubmit}
          whileTap={{ scale: 0.94 }}
          disabled={!customValue}
        >
          Tip →
        </motion.button>
      </div>
      {customError && <p className="custom-error">{customError}</p>}
    </motion.div>
  )
}
