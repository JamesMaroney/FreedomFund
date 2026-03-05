import { useState } from "react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls,
} from "framer-motion";
import type { AudioClip, TipPreset, Goals, ProjectionSettings, CurrencyLocale, BankSettings } from "../types";
import {
  playCoinSound,
  playTadaSound,
  playSpringSound,
  primeAudio,
} from "../utils/audio";
import { formatCents, parseDollarsToCents, CURRENCY_LOCALES } from "../utils/currency";
import { generateId } from "../utils/id";
import { BANK_OPTIONS } from "../constants/presets";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  audioClip: AudioClip;
  onAudioClipChange: (clip: AudioClip) => void;
  goals: Goals;
  onGoalsChange: (g: Goals) => void;
  tipPresets: TipPreset[];
  onTipPresetsChange: (p: TipPreset[]) => void;
  projectionSettings: ProjectionSettings;
  onProjectionSettingsChange: (ps: ProjectionSettings) => void;
  currencyLocale: CurrencyLocale;
  onCurrencyLocaleChange: (cl: CurrencyLocale) => void;
  unsentCents: number;
  onSendToBank: () => void;
  bankSettings: BankSettings;
  onBankSettingsChange: (bs: BankSettings) => void;
  onReset: () => void;
  needRefresh: boolean;
  onUpdate: () => void;
  onCheckForUpdates: () => Promise<void>;
}

const AUDIO_OPTIONS: {
  value: AudioClip;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: "coins",
    label: "Sonic Rings",
    emoji: "🪙",
    description: "Scatter of coin pings",
  },
  {
    value: "tada",
    label: "Ta-da Fanfare",
    emoji: "🎺",
    description: "Brass triumphant chord",
  },
  {
    value: "spring",
    label: "Spring Boing",
    emoji: "🎵",
    description: "Bouncy spring tone",
  },
  {
    value: "random",
    label: "Random",
    emoji: "🎲",
    description: "Surprise me each time",
  },
  {
    value: "off",
    label: "Off",
    emoji: "🔇",
    description: "No sound",
  },
];

const PREVIEW_FN: Partial<Record<AudioClip, () => Promise<void>>> = {
  coins: playCoinSound,
  tada: playTadaSound,
  spring: playSpringSound,
};

const MAX_PRESETS = 8;
const EMOJI_SUGGESTIONS = [
  "☕",
  "🍔",
  "🍕",
  "📦",
  "🧇",
  "🍺",
  "🍽️",
  "🛒",
  "🎮",
  "👗",
  "✂️",
  "🎬",
  "🚗",
  "✈️",
  "🛍️",
  "💅",
];

// ─── Goals section ───────────────────────────────────────────────────────────

function GoalsSection({
  goals,
  onChange,
}: {
  goals: Goals;
  onChange: (g: Goals) => void;
}) {
  const fmt = (cents: number) => (cents / 100).toFixed(2);
  const parse = (val: string) => Math.round(parseDollarsToCents(val));

  const field = (key: keyof Goals, label: string) => (
    <div className="settings-goal-row" key={key}>
      <label className="settings-goal-label">{label}</label>
      <div className="settings-goal-input-wrap">
        <span className="settings-goal-dollar">$</span>
        <input
          className="settings-goal-input"
          type="number"
          inputMode="decimal"
          defaultValue={fmt(goals[key])}
          onBlur={(e) => {
            const cents = parse(e.target.value);
            if (cents > 0) onChange({ ...goals, [key]: cents });
            else e.target.value = fmt(goals[key]);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="settings-section">
      <span className="settings-section-label">GOALS</span>
      <div className="settings-goals-grid">
        {field("dailyCents", "Daily")}
        {field("weeklyCents", "Weekly")}
        {field("monthlyCents", "Monthly")}
      </div>
    </div>
  );
}

// ─── Tip Presets section ──────────────────────────────────────────────────────

interface PresetItemProps {
  preset: TipPreset;
  isEditing: boolean;
  isDirty: boolean;
  emojiPickerId: string | null;
  currencyLocale: CurrencyLocale;
  onToggleEdit: (id: string) => void;
  onUpdate: (id: string, patch: Partial<TipPreset>) => void;
  onSave: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleEmojiPicker: (id: string) => void;
}

function PresetItem({
  preset,
  isEditing,
  isDirty,
  emojiPickerId,
  currencyLocale,
  onToggleEdit,
  onUpdate,
  onSave,
  onRemove,
  onToggleEmojiPicker,
}: PresetItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={preset}
      dragListener={false}
      dragControls={dragControls}
      className={`settings-preset-row settings-preset-reorder-item${isEditing ? " editing" : ""}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Collapsed summary row */}
      {/* Drag handle — absolutely positioned over the left border */}
      <span
        className="settings-preset-drag-handle"
        onPointerDown={(e) => {
          e.preventDefault();
          dragControls.start(e);
        }}
      >
        ⠿
      </span>
      <button
        className="settings-preset-summary"
        onClick={() => onToggleEdit(preset.id)}
      >
        <span className="settings-preset-emoji">{preset.emoji}</span>
        <span className="settings-preset-name">{preset.label}</span>
        <span className="settings-preset-amount">
          {formatCents(preset.amount, currencyLocale)}
        </span>
        <span className="settings-preset-chevron">{isEditing ? "▲" : "▼"}</span>
      </button>

      {/* Expanded edit form */}
      <AnimatePresence initial={false}>
        {isEditing && (
          <motion.div
            className="settings-preset-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: "hidden" }}
          >
            <div className="settings-preset-form-inner">
              {/* Emoji + Amount on the same row */}
              <div className="settings-preset-row-top">
                {/* Emoji */}
                <div className="settings-preset-field">
                  <label className="settings-preset-field-label">Emoji</label>
                  <div style={{ position: "relative" }}>
                    <button
                      className="settings-preset-emoji-btn"
                      onClick={() => onToggleEmojiPicker(preset.id)}
                    >
                      {preset.emoji}{" "}
                      <span style={{ fontSize: "0.65rem", opacity: 0.5 }}>
                        ▼
                      </span>
                    </button>
                    <AnimatePresence>
                      {emojiPickerId === preset.id && (
                        <motion.div
                          className="settings-emoji-picker"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                        >
                          {EMOJI_SUGGESTIONS.map((em) => (
                            <button
                              key={em}
                              className="settings-emoji-option"
                              onClick={() => {
                                onUpdate(preset.id, { emoji: em });
                                onToggleEmojiPicker("");
                              }}
                            >
                              {em}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Amount */}
                <div className="settings-preset-field">
                  <label className="settings-preset-field-label">Amount</label>
                  <div className="settings-goal-input-wrap">
                    <span className="settings-goal-dollar">$</span>
                    <input
                      className="settings-goal-input"
                      type="number"
                      inputMode="decimal"
                      defaultValue={(preset.amount / 100).toFixed(2)}
                      onBlur={(e) => {
                        const cents = parseDollarsToCents(e.target.value);
                        if (cents > 0) onUpdate(preset.id, { amount: cents });
                        else e.target.value = (preset.amount / 100).toFixed(2);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          (e.target as HTMLInputElement).blur();
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Label */}
              <div className="settings-preset-field">
                <label className="settings-preset-field-label">Label</label>
                <input
                  className="settings-preset-text-input"
                  defaultValue={preset.label}
                  maxLength={20}
                  onBlur={(e) =>
                    onUpdate(preset.id, {
                      label: e.target.value || preset.label,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      (e.target as HTMLInputElement).blur();
                  }}
                />
              </div>

              {/* Description */}
              <div className="settings-preset-field">
                <label className="settings-preset-field-label">
                  Description
                </label>
                <input
                  className="settings-preset-text-input"
                  defaultValue={preset.description}
                  maxLength={40}
                  placeholder="e.g. Packed lunch instead"
                  onBlur={(e) =>
                    onUpdate(preset.id, { description: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      (e.target as HTMLInputElement).blur();
                  }}
                />
              </div>

              <div className="settings-preset-actions">
                {isDirty && (
                  <button
                    className="settings-preset-save-btn"
                    onClick={() => onSave(preset.id)}
                  >
                    Save
                  </button>
                )}
                <button
                  className="settings-preset-delete-btn"
                  onClick={() => onRemove(preset.id)}
                >
                  Remove chip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

function TipPresetsSection({
  presets,
  onChange,
  currencyLocale,
}: {
  presets: TipPreset[];
  onChange: (p: TipPreset[]) => void;
  currencyLocale: CurrencyLocale;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emojiPickerId, setEmojiPickerId] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const update = (id: string, patch: Partial<TipPreset>) => {
    onChange(presets.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDirtyIds((prev) => new Set(prev).add(id));
  };

  const save = (id: string) => {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setEditingId(null);
  };

  const remove = (id: string) => {
    onChange(presets.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleEdit = (id: string) => {
    if (editingId === id) {
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setEditingId(null);
    } else {
      setEditingId(id);
    }
  };

  const toggleEmojiPicker = (id: string) =>
    setEmojiPickerId((prev) => (prev === id ? null : id));

  const add = () => {
    if (presets.length >= MAX_PRESETS) return;
    const newPreset: TipPreset = {
      id: generateId(),
      amount: 500,
      label: "New",
      emoji: "💰",
      description: "New preset",
    };
    onChange([...presets, newPreset]);
    setEditingId(newPreset.id);
  };

  return (
    <div className="settings-section">
      <span className="settings-section-label">
        TIP CHIPS ({presets.length}/{MAX_PRESETS})
      </span>
      <Reorder.Group
        axis="y"
        values={presets}
        onReorder={onChange}
        className="settings-presets-list"
        style={{ listStyle: "none", padding: 0 }}
      >
        {presets.map((preset) => (
          <PresetItem
            key={preset.id}
            preset={preset}
            isEditing={editingId === preset.id}
            isDirty={dirtyIds.has(preset.id)}
            emojiPickerId={emojiPickerId}
            currencyLocale={currencyLocale}
            onToggleEdit={toggleEdit}
            onUpdate={update}
            onSave={save}
            onRemove={remove}
            onToggleEmojiPicker={toggleEmojiPicker}
          />
        ))}
      </Reorder.Group>

      {presets.length < MAX_PRESETS && (
        <button className="settings-add-preset-btn" onClick={add}>
          + Add chip
        </button>
      )}
    </div>
  );
}

// ─── Projection section ──────────────────────────────────────────────────────

function ProjectionSection({
  settings,
  onChange,
}: {
  settings: ProjectionSettings;
  onChange: (ps: ProjectionSettings) => void;
}) {
  const updateHorizon = (i: 0 | 1 | 2, val: string) => {
    const n = parseInt(val, 10);
    if (!n || n < 1 || n > 99) return;
    const next: [number, number, number] = [...settings.horizons] as [number, number, number];
    next[i] = n;
    onChange({ ...settings, horizons: next });
  };

  return (
    <div className="settings-section">
      <span className="settings-section-label">PROJECTION</span>
      <div className="settings-projection-grid">
        <div className="settings-goal-row">
          <label className="settings-goal-label">Return rate</label>
          <div className="settings-goal-input-wrap">
            <input
              className="settings-goal-input"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.1}
              defaultValue={settings.annualRatePct}
              onBlur={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v >= 0 && v <= 100)
                  onChange({ ...settings, annualRatePct: v });
                else e.target.value = String(settings.annualRatePct);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
            <span className="settings-goal-dollar">%</span>
          </div>
        </div>
        <div className="settings-projection-horizons">
          <label className="settings-goal-label">Horizons (years)</label>
          <div className="settings-projection-horizon-inputs">
            {([0, 1, 2] as const).map((i) => (
              <input
                key={i}
                className="settings-goal-input settings-horizon-input"
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                defaultValue={settings.horizons[i]}
                onBlur={(e) => updateHorizon(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Currency / Locale section ────────────────────────────────────────────────

function LocaleSection({
  currencyLocale,
  onChange,
}: {
  currencyLocale: CurrencyLocale;
  onChange: (cl: CurrencyLocale) => void;
}) {
  const currentKey = `${currencyLocale.locale}|${currencyLocale.currency}`;

  return (
    <div className="settings-section">
      <div className="settings-section-label settings-locale-header">
        <span>CURRENCY</span>
        <span className="settings-locale-preview">{formatCents(123456, currencyLocale)}</span>
      </div>
      <select
        className="settings-locale-select"
        value={currentKey}
        onChange={(e) => {
          const [locale, currency] = e.target.value.split('|');
          onChange({ locale, currency });
        }}
      >
        {CURRENCY_LOCALES.map((opt) => {
          const key = `${opt.locale}|${opt.currency}`;
          return (
            <option key={key} value={key}>
              {opt.label}
            </option>
          );
        })}
        {/* If the detected system locale isn't in the list, add it */}
        {!CURRENCY_LOCALES.some(
          (o) => o.locale === currencyLocale.locale && o.currency === currencyLocale.currency,
        ) && (
          <option value={currentKey}>
            {currencyLocale.locale} — {currencyLocale.currency} (system)
          </option>
        )}
      </select>
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export default function SettingsPanel({
  isOpen,
  onClose,
  audioClip,
  onAudioClipChange,
  goals,
  onGoalsChange,
  tipPresets,
  onTipPresetsChange,
  projectionSettings,
  onProjectionSettingsChange,
  currencyLocale,
  onCurrencyLocaleChange,
  unsentCents,
  onSendToBank,
  bankSettings,
  onBankSettingsChange,
  onReset,
  needRefresh,
  onUpdate,
  onCheckForUpdates,
}: Props) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [checking, setChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);

  const handleCheckForUpdates = async () => {
    setChecking(true);
    setJustChecked(false);
    await onCheckForUpdates();
    setChecking(false);
    setJustChecked(true);
    setTimeout(() => setJustChecked(false), 3000);
  };

  const handlePreview = (clip: AudioClip) => {
    const fn = PREVIEW_FN[clip];
    if (!fn) return;
    primeAudio();
    void fn();
  };

  const handleSelect = (clip: AudioClip) => {
    primeAudio();
    onAudioClipChange(clip);
    void PREVIEW_FN[clip]?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            className="settings-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
          >
            {/* Header */}
            <div className="settings-header">
              <span className="settings-title">SETTINGS</span>
              <button
                className="settings-close"
                onClick={onClose}
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="settings-body">
              {/* ── Banking ── */}
              <div className="settings-section">
                <span className="settings-section-label">BANKING</span>

                {/* Enable toggle */}
                <div className="settings-bank-toggle-row">
                  <div className="settings-bank-toggle-text">
                    <span className="settings-bank-toggle-label">Bank transfers</span>
                    <span className="settings-bank-toggle-desc">
                      {bankSettings.enabled ? 'Opens your bank to transfer funds' : 'Mark deposits as sent manually'}
                    </span>
                  </div>
                  <button
                    className={`settings-toggle${bankSettings.enabled ? ' settings-toggle--on' : ''}`}
                    onClick={() => onBankSettingsChange({ ...bankSettings, enabled: !bankSettings.enabled })}
                    aria-label={bankSettings.enabled ? 'Disable bank transfers' : 'Enable bank transfers'}
                  >
                    <span className="settings-toggle-thumb" />
                  </button>
                </div>

                {/* Bank selector — only shown when enabled */}
                {bankSettings.enabled && (
                  <select
                    className="settings-locale-select"
                    value={bankSettings.bankId}
                    onChange={(e) => onBankSettingsChange({ ...bankSettings, bankId: e.target.value as BankSettings['bankId'] })}
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                  </select>
                )}

                {/* Send button — only shown when there's an unsent balance */}
                {unsentCents > 0 && (
                  <button
                    className="settings-bank-send-btn"
                    onClick={() => { onSendToBank(); onClose(); }}
                  >
                    {bankSettings.enabled
                      ? `Send ${formatCents(unsentCents, currencyLocale)} to Freedom Fund →`
                      : `Mark ${formatCents(unsentCents, currencyLocale)} as sent to Freedom Fund`}
                  </button>
                )}
              </div>
              <div className="settings-section">
                <span className="settings-section-label">
                  CELEBRATION SOUND
                </span>
                <div className="settings-audio-options">
                  {AUDIO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`settings-audio-btn ${audioClip === opt.value ? "selected" : ""}`}
                      onClick={() => handleSelect(opt.value)}
                    >
                      <div className="settings-audio-btn-left">
                        <span className="settings-audio-emoji">
                          {opt.emoji}
                        </span>
                        <div className="settings-audio-text">
                          <span className="settings-audio-label">
                            {opt.label}
                          </span>
                          <span className="settings-audio-desc">
                            {opt.description}
                          </span>
                        </div>
                      </div>
                      <div className="settings-audio-btn-right">
                        {audioClip === opt.value && (
                          <span className="settings-audio-check">✓</span>
                        )}
                        {PREVIEW_FN[opt.value] && (
                          <button
                            className="settings-preview-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(opt.value);
                            }}
                            aria-label={`Preview ${opt.label}`}
                          >
                            ▶
                          </button>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Goals ── */}
              <GoalsSection goals={goals} onChange={onGoalsChange} />

              {/* ── Projection ── */}
              <ProjectionSection settings={projectionSettings} onChange={onProjectionSettingsChange} />

              {/* ── Currency ── */}
              <LocaleSection currencyLocale={currencyLocale} onChange={onCurrencyLocaleChange} />

              {/* ── Tip Chips ── */}
              <TipPresetsSection
                presets={tipPresets}
                onChange={onTipPresetsChange}
                currencyLocale={currencyLocale}
              />

              {/* ── Danger Zone ── */}
              <div className="settings-section settings-danger-section">
                <span className="settings-section-label">DANGER ZONE</span>
                {!confirmingReset ? (
                  <button
                    className="settings-reset-btn"
                    onClick={() => setConfirmingReset(true)}
                  >
                    Reset unsent balance
                  </button>
                ) : (
                  <div className="settings-reset-confirm">
                    <p className="settings-reset-warning">
                      This will zero out all deposits not yet sent to your bank.
                      This can't be undone.
                    </p>
                    <div className="settings-reset-actions">
                      <button
                        className="settings-reset-confirm-btn"
                        onClick={() => {
                          setConfirmingReset(false);
                          onReset();
                          onClose();
                        }}
                      >
                        Yes, reset
                      </button>
                      <button
                        className="settings-reset-cancel-btn"
                        onClick={() => setConfirmingReset(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="settings-version-footer">
                <span className="settings-version">v{__BUILD_NUMBER__} · {__GIT_HASH__}</span>
                {needRefresh ? (
                  <button className="settings-update-btn settings-update-btn--ready" onClick={onUpdate}>
                    ↑ Update &amp; reload
                  </button>
                ) : (
                  <button
                    className="settings-update-btn"
                    onClick={handleCheckForUpdates}
                    disabled={checking}
                  >
                    {checking ? 'Checking…' : justChecked ? '✓ Up to date' : 'Check for updates'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
