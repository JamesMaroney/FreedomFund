import { useReducer, useCallback, useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useLocalStorage from "./hooks/useLocalStorage";
import { useCelebration } from "./hooks/useCelebration";
import { calculateNewStreak, getTodayString } from "./hooks/useStreak";
import type {
  FreedomFundState,
  AppUIState,
  AppAction,
  Deposit,
  AudioClip,
  TipPreset,
  Goals,
  ProjectionSettings,
  CurrencyLocale,
} from "./types";
import {
  MILESTONE_AMOUNTS,
  DEFAULT_WEEKLY_GOAL_CENTS,
  DEFAULT_TIP_PRESETS,
  DEFAULT_GOALS,
  DEFAULT_PROJECTION_SETTINGS,
  DEFAULT_CURRENCY_LOCALE,
} from "./constants/presets";
import { formatCents } from "./utils/currency";
import { generateId } from "./utils/id";
import { primeAudio } from "./utils/audio";
import HomeScreen from "./components/HomeScreen";
import AmountSelector from "./components/AmountSelector";
import CelebrationOverlay from "./components/CelebrationOverlay";
import TransferButton from "./components/TransferButton";
import MilestoneToast from "./components/MilestoneToast";
import SettingsPanel from "./components/SettingsPanel";
import "./App.css";

const DEFAULT_FUND_STATE: FreedomFundState = {
  totalSaved: 0,
  currentStreak: 0,
  lastDepositDate: "",
  deposits: [],
  weeklyGoal: DEFAULT_WEEKLY_GOAL_CENTS,
  milestones: [],
  challengeStartDate: getTodayString(),
  goals: DEFAULT_GOALS,
  tipPresets: DEFAULT_TIP_PRESETS,
  projectionSettings: DEFAULT_PROJECTION_SETTINGS,
  currencyLocale: DEFAULT_CURRENCY_LOCALE,
};

function uiReducer(state: AppUIState, action: AppAction): AppUIState {
  switch (action.type) {
    case "OPEN_SELECTOR":
      return { ...state, screen: "SELECTING_AMOUNT" };
    case "CONFIRM_DEPOSIT":
      return {
        ...state,
        screen: "CELEBRATING",
        pendingAmount: action.amount,
        pendingLabel: action.label,
      };
    case "CELEBRATION_COMPLETE":
      return { ...state, screen: "TRANSFER_PROMPT" };
    case "MARK_TRANSFERRED":
    case "DISMISS":
      return {
        screen: "IDLE",
        pendingAmount: 0,
        pendingLabel: "",
        lastDepositId: null,
      };
    default:
      return state;
  }
}

const INITIAL_UI: AppUIState = {
  screen: "IDLE",
  pendingAmount: 0,
  pendingLabel: "",
  lastDepositId: null,
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function App() {
  const [fundState, setFundState] = useLocalStorage<FreedomFundState>(
    "freedom-fund-state",
    DEFAULT_FUND_STATE,
  );
  const [ui, dispatch] = useReducer(uiReducer, INITIAL_UI);
  const [milestoneHit, setMilestoneHit] = useState<number | null>(null);
  const [lastDepositId, setLastDepositId] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transferPending, setTransferPending] = useState(false);
  const awaitingTransferReturn = useRef(false);
  const [audioClip, setAudioClip] = useLocalStorage<AudioClip>(
    "freedom-fund-audio-clip",
    "coins",
  );
  const { trigger: triggerCelebration } = useCelebration(audioClip);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        awaitingTransferReturn.current
      ) {
        awaitingTransferReturn.current = false;
        setTransferPending(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleTipYourself = useCallback(() => {
    // Prime audio here (first gesture) so the AudioContext is fully running
    // by the time the celebration sound fires on the chip-tap (second gesture).
    primeAudio();
    dispatch({ type: "OPEN_SELECTOR" });
  }, []);

  const handleSelectAmount = useCallback(
    (amount: number, label: string) => {
      const today = getTodayString();
      const newStreak = calculateNewStreak(
        fundState.currentStreak,
        fundState.lastDepositDate,
      );
      const newTotal = fundState.totalSaved + amount;

      const deposit: Deposit = {
        id: generateId(),
        amount,
        label,
        timestamp: new Date().toISOString(),
        transferred: false,
      };

      const newMilestone = MILESTONE_AMOUNTS.find(
        (m) => !fundState.milestones.includes(m * 100) && newTotal >= m * 100,
      );

      setFundState((prev) => ({
        ...prev,
        totalSaved: newTotal,
        currentStreak: newStreak,
        lastDepositDate: today,
        deposits: [deposit, ...prev.deposits],
        milestones: newMilestone
          ? [...prev.milestones, newMilestone * 100]
          : prev.milestones,
      }));

      setLastDepositId(deposit.id);
      dispatch({ type: "CONFIRM_DEPOSIT", amount, label });

      if (newMilestone) {
        setMilestoneHit(newMilestone);
        triggerCelebration({ isMilestone: true });
      } else {
        triggerCelebration();
      }
    },
    [fundState, setFundState, triggerCelebration],
  );

  const handleCelebrationComplete = useCallback(() => {
    dispatch({ type: "CELEBRATION_COMPLETE" });
  }, []);

  const handleMarkTransferred = useCallback(() => {
    if (lastDepositId) {
      setFundState((prev) => ({
        ...prev,
        deposits: prev.deposits.map((d) =>
          d.id === lastDepositId ? { ...d, transferred: true } : d,
        ),
      }));
    }
    dispatch({ type: "MARK_TRANSFERRED" });
  }, [lastDepositId, setFundState]);

  const handleDismiss = useCallback(() => {
    dispatch({ type: "DISMISS" });
  }, []);

  const handleInstallPWA = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") setInstallPrompt(null);
  }, [installPrompt]);

  const handleReset = useCallback(() => {
    setFundState((prev) => {
      const unsentAmount = prev.deposits
        .filter((d) => !d.transferred)
        .reduce((sum, d) => sum + d.amount, 0);
      return {
        ...prev,
        totalSaved: prev.totalSaved - unsentAmount,
        deposits: prev.deposits.filter((d) => d.transferred),
      };
    });
  }, [setFundState]);

  return (
    <div className="app-root">
      <AnimatePresence mode="wait">
        {ui.screen === "IDLE" && (
          <HomeScreen
            key="home"
            fundState={fundState}
            onTipYourself={handleTipYourself}
            onOpenSettings={() => setSettingsOpen(true)}
            installPrompt={installPrompt !== null}
            onInstall={handleInstallPWA}
            projectionSettings={fundState.projectionSettings ?? DEFAULT_PROJECTION_SETTINGS}
            currencyLocale={fundState.currencyLocale ?? DEFAULT_CURRENCY_LOCALE}
            unsentCents={fundState.deposits
              .filter((d) => !d.transferred)
              .reduce((sum, d) => sum + d.amount, 0)}
            onSendToAlly={() => {
              const amount = fundState.deposits
                .filter((d) => !d.transferred)
                .reduce((sum, d) => sum + d.amount, 0);
              navigator.clipboard
                .writeText(`${(amount / 100).toFixed(2)}`)
                .catch(() => {});
              awaitingTransferReturn.current = true;
              const a = document.createElement("a");
              a.href = "https://secure.ally.com/payments/transfers#";
              a.rel = "noopener noreferrer";
              a.click();
            }}
          />
        )}
        {ui.screen === "SELECTING_AMOUNT" && (
          <AmountSelector
            key="selector"
            tipPresets={fundState.tipPresets ?? DEFAULT_TIP_PRESETS}
            currencyLocale={fundState.currencyLocale ?? DEFAULT_CURRENCY_LOCALE}
            onSelect={handleSelectAmount}
            onBack={handleDismiss}
          />
        )}
        {ui.screen === "CELEBRATING" && (
          <CelebrationOverlay
            key="celebration"
            amount={ui.pendingAmount}
            label={ui.pendingLabel}
            isMilestone={!!milestoneHit}
            currencyLocale={fundState.currencyLocale ?? DEFAULT_CURRENCY_LOCALE}
            onComplete={handleCelebrationComplete}
          />
        )}
        {ui.screen === "TRANSFER_PROMPT" && (
          <TransferButton
            key="transfer"
            amount={ui.pendingAmount}
            totalSavedCents={fundState.totalSaved}
            projectionSettings={fundState.projectionSettings ?? DEFAULT_PROJECTION_SETTINGS}
            currencyLocale={fundState.currencyLocale ?? DEFAULT_CURRENCY_LOCALE}
            onTransfer={handleMarkTransferred}
            onSkip={handleDismiss}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {milestoneHit !== null && (
          <MilestoneToast
            key="milestone"
            amount={milestoneHit}
            onDismiss={() => setMilestoneHit(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transferPending && (
          <motion.div
            key="transfer-confirm"
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
                  {(() => {
                    const cents = fundState.deposits
                      .filter((d) => !d.transferred)
                      .reduce((sum, d) => sum + d.amount, 0);
                    return formatCents(cents, fundState.currencyLocale ?? DEFAULT_CURRENCY_LOCALE);
                  })()}
                </span>{" "}
                go through?
              </p>
              <div className="transfer-confirm-actions">
                <button
                  className="transfer-confirm-btn transfer-confirm-btn--yes"
                  onClick={() => {
                    setFundState((prev) => ({
                      ...prev,
                      deposits: prev.deposits.map((d) => ({
                        ...d,
                        transferred: true,
                      })),
                    }));
                    setTransferPending(false);
                  }}
                >
                  Yes, lock it in 🔒
                </button>
                <button
                  className="transfer-confirm-btn transfer-confirm-btn--no"
                  onClick={() => setTransferPending(false)}
                >
                  Not yet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        audioClip={audioClip}
        onAudioClipChange={setAudioClip}
        goals={fundState.goals ?? DEFAULT_GOALS}
        onGoalsChange={(g: Goals) =>
          setFundState((prev) => ({ ...prev, goals: g }))
        }
        tipPresets={fundState.tipPresets ?? DEFAULT_TIP_PRESETS}
        onTipPresetsChange={(p: TipPreset[]) =>
          setFundState((prev) => ({ ...prev, tipPresets: p }))
        }
        projectionSettings={fundState.projectionSettings ?? DEFAULT_PROJECTION_SETTINGS}
        onProjectionSettingsChange={(ps: ProjectionSettings) =>
          setFundState((prev) => ({ ...prev, projectionSettings: ps }))
        }
        currencyLocale={fundState.currencyLocale ?? DEFAULT_CURRENCY_LOCALE}
        onCurrencyLocaleChange={(cl: CurrencyLocale) =>
          setFundState((prev) => ({ ...prev, currencyLocale: cl }))
        }
        unsentCents={fundState.deposits
          .filter((d) => !d.transferred)
          .reduce((sum, d) => sum + d.amount, 0)}
        onSendToAlly={() => {
          const amount = fundState.deposits
            .filter((d) => !d.transferred)
            .reduce((sum, d) => sum + d.amount, 0);
          navigator.clipboard
            .writeText(`${(amount / 100).toFixed(2)}`)
            .catch(() => {});
          awaitingTransferReturn.current = true;
          const a = document.createElement("a");
          a.href = "https://secure.ally.com/payments/transfers#";
          a.rel = "noopener noreferrer";
          a.click();
        }}
        onReset={handleReset}
      />
    </div>
  );
}
